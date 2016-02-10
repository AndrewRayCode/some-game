import db from '../../src/db';

export function saveLevelAndBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData, entities, bookData } = request.body;

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
            data: bookData
        };

        // Insert the new level but we're not done with it yet...
        return db.insert( newLevel )
            .into( 'levels' )
            .returning( 'id' )
            .then( insertedLevelIds => {

                const id = insertedLevelIds[ 0 ];

                return {
                    title: name,
                    data: {
                        levelData: {
                            ...levelData,
                            id
                        },
                        entities
                    }
                };

            // Update the level json to have the new id hard coded inside it
            }).then( levelWithUpdatedId =>

                db( 'levels' )
                    .where({ id: levelWithUpdatedId.data.id })
                    .update( levelWithUpdatedId )
                    .then( () => levelWithUpdatedId )

            // Then insert this book, which contains all the level chapters,
            // but again we aren't done yet...
            ).then( levelWithUpdatedId =>
                   
                db.insert( bookData )
                    .into( 'books' )
                    .returning( 'id' )
                    .then( insertedBookIds => ({
                        insertedBookIds, levelWithUpdatedId
                    }))

            // Grab the latest inserted book id and construct a new book object
            // with the id copied into it...
            ).then( continuationData => {
                 
                const id = continuationData.insertedBookIds[ 0 ];
                return {
                    ...continuationData,
                    bookWithUpdatedId: {
                        ...bookData,
                        data: {
                            ...bookData.data,
                            id
                        }
                    }
                };

            // Then update the newly inserted book with the latest id
            }).then( continuationData =>

                db( 'books' )
                    .where({ id: continuationData.bookWithUpdatedId.id })
                    .update( continuationData.bookWithUpdatedId )
                    .then( () => continuationData )
                
            ).then( continuationData => resolve({
                oldLevelId: levelData.id,
                oldBookId: bookData.id,
                newLevelId: continuationData.levelWithUpdatedId.data.id,
                newBookId: continuationData.bookWithUpdatedId.id,
            }) ).catch( reject );
        
    });

}

export function updateLevelAndBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData, entities } = request.body;
        const { name } = levelData;

        const updatedLevel = {
            title: name,
            data: { levelData, entities }
        };

        return db( 'levels' )
            .where({ id: levelData.id })
            .update( updatedLevel )
            .then( resolve )
            .catch( reject );
        
    });

}

export function loadLevels( request ) {

    return new Promise( ( resolve, reject ) => {

        return db( 'levels' )
            .select( '*' )
            .then( results => {

                // Parse rows from strings in sql to json
                const jsonRows = results.map( row => JSON.parse( row.data ) );

                // Collect all entities by id, to do legacy lookup below
                const allEntities = jsonRows.reduce( ( memo, json ) => ({
                    ...memo,
                    ...json.entities,
                }), {} );

                resolve( jsonRows.reduce( ( memo, json ) => {

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
                  }, { levels: {}, entities: allEntities } ) );

            })
            .catch( reject );
        
    });

}
