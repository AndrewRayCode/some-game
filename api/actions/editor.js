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
            .then( id => resolve({
                oldId: levelData.id,
                id: id[ 0 ]
            }) )
            .catch( reject );
        
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

        console.log('lol what');
        return db( 'levels' )
            .select( '*' )
            .then( resolve )
            .catch( reject );
        
    });

}
