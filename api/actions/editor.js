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
