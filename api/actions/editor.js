import db from '../../src/db';
import knex from 'knex';
import { without } from '../../src/helpers/Utils';

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
            .catch( error => {
                console.error( error );
                reject( error );
            });
        
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
            .then( resolve )
            .catch( error => {
                console.error( error );
                reject( error );
            });

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

        const { bookData: unsanitizedBookData, chapters } = request.body;

        const newBook = denormalizeBook( unsanitizedBookData, chapters );

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

        const { bookData: unsanitizedBookData, chapters } = request.body;
        const { id } = unsanitizedBookData;

        const updatedBook = denormalizeBook( unsanitizedBookData, chapters );

        return db( 'books' )
            .where({ id })
            .update( updatedBook )
            .then( resolve )
            .catch( error => {
                console.error( error );
                reject( error );
            });

    });

}

export function loadAllBooks( request ) {

    return new Promise( ( resolve, reject ) => {

        return db( 'levels' )
            .select( '*' )
            .then( levelRows => {

                // Parse rows from strings in sql to json
                const jsonRows = levelRows.map( row => ({
                    id: row.id,
                    name: row.title,
                    data: JSON.parse( row.data )
                }));

                // Collect all entities by id
                const allEntities = jsonRows.reduce( ( memo, row ) => ({
                    ...memo,
                    ...row.data.entities,
                }), {} );

                // Merge the contents of levelData into the top level object
                return jsonRows.reduce( ( memo, row ) => {

                    memo.levels[ row.id ] = {
                        id: row.id,
                        name: row.name,
                        ...row.data.levelData
                    };
                    return memo;

                }, { levels: {}, entities: allEntities } );

            }).then( allLevelData =>

                db( 'books' )
                    .select( '*' )
                    .then( bookRows => ({ bookRows, allLevelData }) )

            ).then( continuationData => {

                const { bookRows, allLevelData } = continuationData;

                // Parse rows from strings in sql to json
                const jsonRows = bookRows.map( row => ({
                    id: row.id,
                    name: row.title,
                    data: JSON.parse( row.data )
                }));

                // Normalize books and chapters
                const chapters = jsonRows.reduce( ( memo, row ) => ({
                    ...memo,
                    ...row.data.chapters,
                }), {} );

                // Merge the contents of bookData into the top level object
                const books = jsonRows.reduce( ( memo, row ) => {

                    memo[ row.id ] = {
                        id: row.id,
                        name: row.name,
                        ...row.data.bookData
                    };
                    return memo;

                }, {} );

                resolve({ ...allLevelData, books, chapters });

            }).catch( error => {
                console.error( error );
                reject( error );
            });
        
    });

}
