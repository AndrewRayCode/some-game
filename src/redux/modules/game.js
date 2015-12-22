export default function game(state = [], action = {}) {

    switch (action.type) {

        case 'ADD_ENTITY':
            return [ ...state, {
                id: action.id,
                type: action.entityType,
                position: action.position,
                scale: action.scale,
                rotation: action.rotation
            } ];

        case 'REMOVE_ENTITY':

            const entity = state.find( ( search ) => {
                return search.id === action.id;
            });
            const index = state.indexOf( entity );

            return [
                ...state.slice( 0, index ),
                ...state.slice( index + 1 )
            ];

        default:
            return state;

    }

}

export function addEntity( entityType, position, scale, rotation ) {
    return {
        type: 'ADD_ENTITY',
        id: Date.now(),
        entityType, position, scale, rotation
    };
}

export function removeEntity( id ) {
    return {
        type: 'REMOVE_ENTITY',
        id
    };
}
