import db from '../../src/db';
import knex from 'knex';
import without from '../../src/containers/Dung/Utils';

// Level management

function denormalizeLevel( unsanitizedLevelData, entities ) {

    // Construct the new level object to insert into the db. We manipulate
    // the fields because some fields, like title, are columns in postgres.
    const { name: levelTitle } = unsanitizedLevelData;

    // Create the json column data. Make sure we don't duplicate id into json
    // in postgres, that's only for client side
    const levelData = {
        ...without( unsanitizedLevelData, 'id' ),
        saved: true
    };

    return {
        title: levelTitle,
        data: { levelData, entities }
    };

}

export function saveLevel( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData: unsanitizedLevelData, entities } = request.body;

        const newLevel = denormalizeLevel( unsanitizedLevelData, entities );

        return db
            .insert( newLevel )
            .into( 'levels' )
            .returning( 'id' )
            .then( insertedLevelIds => resolve({
                oldLevelId: unsanitizedLevelData.id,
                newLevelId: insertedLevelIds[ 0 ].toString(),
            }) )
            .catch( reject );
        
    });

}

export function updateLevel( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData: unsanitizedLevelData, entities } = request.body;
        const { id } = unsanitizedLevelData;

        const updatedLevel = denormalizeLevel( unsanitizedLevelData, entities );

        return db( 'levels' )
            .where({ id })
            .update( updatedLevel )
            .catch( reject );

    });

}

// Book management

function denormalizeBook( unsanitizedBookData, chapters ) {

    // Construct the new level object to insert into the db. We manipulate
    // the fields because some fields, like title, are columns in postgres.
    const { name: bookTitle } = unsanitizedBookData;

    // Create the json column data. Make sure we don't duplicate id into json
    // in postgres, that's only for client side
    const bookData = {
        ...without( unsanitizedBookData, 'id' ),
        saved: true
    };

    return {
        title: bookTitle,
        data: { bookData, chapters }
    };

}

export function saveBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { bookData: unsanitizedBookData, entities } = request.body;

        const newBook = denormalizeBook( unsanitizedBookData, entities );

        return db
            .insert( newBook )
            .into( 'books' )
            .returning( 'id' )
            .then( insertedBookIds => resolve({
                oldBookId: unsanitizedBookData.id,
                newBookId: insertedBookIds[ 0 ].toString(),
            }) )
            .catch( error => {
                console.error( error );
                reject( error );
            });
        
    });

}

export function updateBook( request ) {

    return new Promise( ( resolve, reject ) => {

        const { bookData: unsanitizedBookData, entities } = request.body;
        const { id } = unsanitizedBookData;

        const updatedBook = denormalizeBook( unsanitizedBookData, entities );

        return db( 'books' )
            .where({ id })
            .update( updatedBook )
            .catch( error => {
                console.error( error );
                reject( error );
            });

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
