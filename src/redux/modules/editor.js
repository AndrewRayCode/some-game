import THREE from 'three';

const LOAD = 'redux-example/LOAD';
const LOAD_SUCCESS = 'redux-example/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/LOAD_FAIL';

const defaultState = {
    levels: [],
    currentLevel: null
};

export default function game( state = defaultState, action = {} ) {

    switch( action.type ) {

        case 'ADD_LEVEl':
            return {
                ...state,
                levels: [
                    ...state.levels, action.level
                ]
            };

        case 'ADD_ENTITY':

            return {
                ...state,
                entities: [ ...state.entities, {
                    id: action.id,
                    type: action.entityType,
                    position: action.position,
                    scale: action.scale,
                    rotation: action.rotation,
                    materialId: action.materialId
                }]
            };

        case 'REMOVE_ENTITY':

            const entity = state.entities.find( ( search ) => {
                return search.id === action.id;
            });
            const index = state.entities.indexOf( entity );

            return {
                ...state,
                entities: [ ...state.entities, {
                    ...state.entities.slice( 0, index ),
                    ...state.entities.slice( index + 1 )
                }]
            };

        case 'CHANGE_ENTITY_MATERIAL_ID':

            const cEntity = state.entities.find( ( search ) => {
                return search.id === action.id;
            });
            const cIndex = state.entities.indexOf( cEntity );

            const texturedEntity = Object.assign( {}, cEntity, {
                materialId: action.newMaterialId
            });

            return {
                ...state,
                entities: [
                    ...state.entities.slice( 0, cIndex ),
                    texturedEntity,
                    ...state.entities.slice( cIndex + 1 )
                ]
            };

        case 'MOVE_ENTITY':

            const mEntity = state.entities.find( ( search ) => {
                return search.id === action.id;
            });
            const mIndex = state.entities.indexOf( mEntity );
            const { position } = mEntity;
            const { field, value } = action;

            const movedEntity = Object.assign( {}, mEntity, {
                position: new THREE.Vector3(
                    field === 'x' ? value : position.x,
                    field === 'y' ? value : position.y,
                    field === 'z' ? value : position.z
                )
            });

            return {
                ...state,
                entities: [ ...state.entities, {
                    ...state.entities.slice( 0, mIndex ),
                    movedEntity,
                    ...state.entities.slice( mIndex + 1 )
                }]
            };

        case 'ROTATE_ENTITY':

            const rEntity = state.entities.find( ( search ) => {
                return search.id === action.id;
            });
            const rIndex = state.entities.indexOf( rEntity );
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

            return {
                ...state,
                entities: [ ...state.entities, {
                    ...state.entities.slice( 0, rIndex ),
                    rotatedEntity,
                    ...state.entities.slice( rIndex + 1 )
                }]
            };

        case LOAD:
            return {
                ...state,
                loading: true
            };

        case LOAD_SUCCESS:
            return {
                ...state,
                loading: false,
                loaded: true,
                levels: action.levels
            };

        case LOAD_FAIL:
            return {
                ...state,
                loading: false,
                loaded: false,
                error: action.error
            };

        default:
            return state;

    }

}

export function addEntity( entityType, position, scale, rotation, materialId ) {
    return {
        type: 'ADD_ENTITY',
        id: Date.now(),
        entityType, position, scale, rotation, materialId
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

export function changeEntityMaterial( id, newMaterialId ) {
    return {
        type: 'CHANGE_ENTITY_MATERIAL_ID',
        id, newMaterialId
    };
}

export function loadLevels() {
  return {
    types: [LOAD, LOAD_SUCCESS, LOAD_FAIL],
    promise: (client) => client.get('/loadInfo')
  };
}

export function areLevelsLoaded(globalState) {
  return globalState.info && globalState.info.loaded;
}
