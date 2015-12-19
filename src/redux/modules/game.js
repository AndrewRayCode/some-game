export default function game(state = [], action = {}) {

    switch (action.type) {

        case 'ADD_WALL':
            return [ ...state, {
                id: action.id,
                position: action.position,
                scale: action.scale
            } ];

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
