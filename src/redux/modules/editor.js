import THREE from 'three';

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

        case 'MOVE_ENTITY':

            const mEntity = state.find( ( search ) => {
                return search.id === action.id;
            });
            const mIndex = state.indexOf( mEntity );
            const { position } = mEntity;
            const { field, value } = action;

            const movedEntity = Object.assign( {}, mEntity, {
                position: new THREE.Vector3(
                    field === 'x' ? value : position.x,
                    field === 'y' ? value : position.y,
                    field === 'z' ? value : position.z
                )
            });

            return [
                ...state.slice( 0, mIndex ),
                movedEntity,
                ...state.slice( mIndex + 1 )
            ];

        case 'ROTATE_ENTITY':

            const rEntity = state.find( ( search ) => {
                return search.id === action.id;
            });
            const rIndex = state.indexOf( rEntity );
            const { rotation } = rEntity;
            const rField = action.field;
            const rValue = action.value;

            const rotatedEntity = Object.assign( {}, rEntity, {
                rotation: new THREE.Vector3(
                    rField === 'x' ? rValue : rotation.x,
                    rField === 'y' ? rValue : rotation.y,
                    rField === 'z' ? rValue : rotation.z
                )
            });

            return [
                ...state.slice( 0, rIndex ),
                rotatedEntity,
                ...state.slice( rIndex + 1 )
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

export function moveEntity( id, field, value ) {
    return {
        type: 'MOVE_ENTITY',
        id, field, value
    };
}

export function rotateEntity( id, field, value ) {
    return {
        type: 'ROTATE_ENTITY',
        id, field, value
    };
}
