export default function game(state = [], action = {}) {

    switch (action.type) {

        case 'ADD_WALL':
            return [ ...state, {
                id: action.id,
                position: action.position,
                scale: action.scale
            } ];

        case 'REMOVE_WALL':

            const wall = state.find( ( search ) => {
                return search.id === action.id;
            });
            const index = state.indexOf( wall );

            return [
                ...state.slice( 0, index ),
                ...state.slice( index + 1 )
            ];

        default:
            return state;

    }

}

export function addWall( position, scale ) {
    return {
        type: 'ADD_WALL',
        id: Date.now(),
        position, scale
    };
}

export function removeWall( id ) {
    return {
        type: 'REMOVE_WALL',
        id
    };
}
