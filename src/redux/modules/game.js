import THREE from 'three';

const defaultState = {
    playerRadius: 0.45,
    playerScale: 1,
    playerMass: 5,
    entities: []
};

export default function game( state = defaultState, action = {} ) {

    switch( action.type ) {

        case 'START_GAME':

            return Object.assign( {}, state, {
                entities: action.entities.filter( ( entity ) => {
                    return entity.type !== 'player';
                }),
                playerPosition: ( action.entities.find( ( entity ) => {
                    return entity.type === 'player';
                }) || {} ).position || new THREE.Vector3( 0, 1.5, 0 )
            });

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

export function startGame( entities ) {
    return {
        type: 'START_GAME',
        entities
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

