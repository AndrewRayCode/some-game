import db from '../../src/db';
import knex from 'knex';

export function saveLevelAndBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData, entities, bookData, chapters } = request.body;

        // Construct the new level object to insert into the db. We manipulate
        // the fields because some fields, like title, are columns in postgres.
        const { name: levelTitle } = levelData;
        levelData.saved = true;
        const newLevel = {
            title: levelTitle,
            data: { levelData, entities }
        };

        // Same for the book
        const { name: bookTitle } = bookData;
        bookData.saved = true;
        const newBook = {
            title: bookTitle,
            data: { bookData, chapters }
        };


        return db.transaction( transaction =>

            // Insert the new level but we're not done with it yet...
            transaction
                .insert( newLevel )
                .into( 'levels' )
                .returning( 'id' )
                .then( insertedLevelIds => {

                    const id = insertedLevelIds[ 0 ].toString();

                    return {
                        ...newLevel,
                        data: {
                            ...newLevel.data,
                            levelData: {
                                ...levelData,
                                id
                            }
                        }
                    };

                // Update the level json to have the new id hard coded inside it
                }).then( levelWithUpdatedId =>

                    db( 'levels' )
                        .transacting( transaction )
                        .where({ id: levelWithUpdatedId.data.id })
                        .update( levelWithUpdatedId )
                        .then( () => levelWithUpdatedId )

                // Then insert this book, which contains all the level chapters,
                // but again we aren't done yet...
                ).then( levelWithUpdatedId =>
                    
                    transaction
                        .insert( newBook )
                        .into( 'books' )
                        .returning( 'id' )
                        .then( insertedBookIds => ({
                            insertedBookIds, levelWithUpdatedId
                        }))

                // Grab the latest inserted book id and construct a new book object
                // with the id copied into it...
                ).then( continuationData => {
                    
                    const id = continuationData.insertedBookIds[ 0 ].toString();

                    return {
                        ...continuationData,
                        bookWithUpdatedId: {
                            ...newBook,
                            data: {
                                ...newBook.data,
                                bookData: {
                                    ...bookData,
                                    id
                                }
                            }
                        }
                    };

                // Then update the newly inserted book with the latest id
                }).then( continuationData =>

                    db( 'books' )
                        .transacting( transaction )
                        .where({ id: continuationData.bookWithUpdatedId.id })
                        .update( continuationData.bookWithUpdatedId )
                        .then( () => continuationData )

                ).then( continuationData =>

                    transaction
                        .commit()
                        .then( () => continuationData )
                    
                ).then( continuationData => resolve({
                    oldLevelId: levelData.id,
                    oldBookId: bookData.id,
                    newLevelId: continuationData.levelWithUpdatedId.data.levelData.id,
                    newBookId: continuationData.bookWithUpdatedId.data.bookData.id,
                }) )
                .catch( transaction.rollback )

        ).catch( reject );
        
    });

}

export function updateLevelAndBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData, entities, bookData, chapters } = request.body;

        const { name: levelName } = levelData;
        const updatedLevel = {
            title: name,
            data: { levelData, entities }
        };

        const { name: bookName } = bookData;
        const updatedBook = {
            title: bookName,
            data: { bookData, chapters }
        };

        return db.transaction( transaction =>

            db( 'levels' )
                .transacting( transaction )
                .where({ id: levelData.id })
                .update( updatedLevel )
                .then( () =>

                    db( 'books' )
                        .transacting( transaction )
                        .where({ id: bookData.id })
                        .update( updatedLevel )

                ).then( resolve )
                .catch( transaction.rollback )
                .catch( reject )

        );
        
    });

}

export function loadAllData( request ) {

    return new Promise( ( resolve, reject ) => {

        return db( 'levels' )
            .select( '*' )
            .then( levelRows => {

                // Parse rows from strings in sql to json
                const jsonRows = levelRows.map( row => JSON.parse( row.data ) );

                // Collect all entities by id, to do legacy lookup below
                const allEntities = jsonRows.reduce( ( memo, json ) => ({
                    ...memo,
                    ...json.entities,
                }), {} );

                return jsonRows.reduce( ( memo, json ) => {

                    const { levelData } = json;

                    // Old levels will have a nextLevelId key
                    const hasLegacyId = 'nextLevelId' in levelData;
                    const nextLevelId = levelData.nextLevelId;
                    delete levelData.nextLevelId;

                    levelData.nextLevelIds = hasLegacyId ? [{
                        levelId: nextLevelId,
                        entityId: levelData.entityIds.find( id => allEntities[ id ].type === 'level' ),
                    }] : levelData.nextLevelIds || [];

                    memo.levels[ levelData.id ] = levelData;

                    return memo;
                  }, { levels: {}, entities: allEntities } );

            }).then( allLevelData =>

                db( 'books' )
                    .select( '*' )
                    .then( bookRows => ({ bookRows, allLevelData }) )

            ).then( continuationData => {

                const { bookRows, allLevelData } = continuationData;

                // Parse rows from strings in sql to json
                const jsonRows = bookRows.map( row => JSON.parse( row.data ) );

                // Normalize books and chapters
                const chapters = jsonRows.reduce( ( memo, json ) => ({
                    ...memo,
                    ...json.chapters,
                }), {} );

                const books = jsonRows.reduce( ( memo, json ) => {

                    const { bookData } = json;
                    memo[ bookData.id ] = bookData;
                    return memo;

                }, {} );

                resolve({ ...allLevelData, books, chapters });

            })
            .catch( error => {
                console.error( error );
                reject( error );
            });
        
    });

}
