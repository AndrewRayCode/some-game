import THREE from 'three';

const defaultState = {
    playerRadius: 0.45,
    playerScale: 1,
    playerMass: 5,
    entities: {},
    levels: {}
};

export default function game( state = defaultState, action = {} ) {

    switch( action.type ) {

        case 'START_GAME':

            const { entities, levels } = action;

            return {
                ...state,
                levels: Object.keys( levels ).reduce( ( memo, id ) => {

                    const level = levels[ id ];
                    memo[ id ] = {
                        ...level,
                        entityIds: level.entityIds.slice( 0 )
                    };
                    return memo;

                }, {} ),
                entities: Object.keys( entities ).reduce( ( memo, id ) => {

                    if( entities[ id ].type !== 'player' ) {

                        const entity = entities[ id ];
                        memo[ id ] = {
                            ...entity,
                            position: entity.position.clone(),
                            scale: entity.scale.clone(),
                            rotation: entity.rotation.clone(),
                        };

                    }

                    return memo;

                }, {} ),
                playerPosition: ( ( entities[ Object.keys( entities ).find(
                    ( id ) => entities[ id ].type === 'player'
                ) ] || {} ).position || new THREE.Vector3( 0, 1.5, 0 ) ).clone()
            };

        case 'SCALE_PLAYER':

            const sEntity = state.entities.find( ( search ) => {
                return search.id === action.powerupIdToRemove;
            });
            const sIndex = state.entities.indexOf( sEntity );

            return {
                ...state,
                playerRadius: state.playerRadius * action.multiplier,
                playerScale: state.playerScale * action.multiplier,
                entities: [
                    ...state.entities.slice( 0, sIndex ),
                    ...state.entities.slice( sIndex + 1 )
                ]
            };

        case 'END_GAME':
            return defaultState;

        default:
            return state;

    }

}

export function startGame( levels, entities ) {
    return {
        type: 'START_GAME',
        levelId: Object.keys( levels )[ 0 ],
        levels, entities
    };
}

export function scalePlayer( powerupIdToRemove, multiplier ) {
    return {
        type: 'SCALE_PLAYER',
        powerupIdToRemove, multiplier
    };
}

export function endGame() {
    return { type: 'END_GAME' };
}

