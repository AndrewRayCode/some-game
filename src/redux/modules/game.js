import THREE from 'three.js';

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
                entities: action.entities
            });

        case 'SHRINK_PLAYER':

            const sEntity = state.entities.find( ( search ) => {
                return search.id === action.entityId;
            });
            const sIndex = state.entities.indexOf( sEntity );

            return {
                ...state,
                playerRadius: state.playerRadius / 2,
                playerScale: state.playerScale / 2,
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

export function shrinkPlayer( entityId ) {
    return {
        type: 'SHRINK_PLAYER',
        entityId
    };
}

export function endGame() {
    return { type: 'END_GAME' };
}
