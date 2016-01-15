import db from '../../src/db';

export function saveLevel( request ) {

    return new Promise( ( resolve, reject ) => {

        const { levelData, entities } = request.body;
        const { name } = levelData;

        levelData.saved = true;

        const newLevel = {
            title: name,
            data: { levelData, entities }
        };

        return db.insert( newLevel )
            .into( 'levels' )
            .returning( 'id' )
            .then( ids => {

                const id = ids[ 0 ];
                const levelWithUpdatedIdInJSON = {
                    title: name,
                    data: { levelData: {
                        ...levelData,
                        id
                    }, entities }
                };

                return db( 'levels' )
                    .where({ id })
                    .update( levelWithUpdatedIdInJSON )
                    .returning( 'id' );

            }).then( id => resolve({
                oldId: levelData.id,
                id: id[ 0 ]
            }) ).catch( reject );
        
    });

}

export function updateLevel( request ) {

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
            .then( results =>
                  resolve( results.reduce( ( memo, sqlRow ) => {
                    const json = JSON.parse( sqlRow.data );
                    memo.levels[ sqlRow.id ] = json.levelData;
                    memo.entities = {
                        ...memo.entities,
                        ...json.entities
                    };
                    return memo;
                  }, { levels: {}, entities: {} } ) )
            )
            .catch( reject );
        
    });

}
