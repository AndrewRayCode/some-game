import THREE from 'three';
import { without } from '../../containers/Dung/Utils';

const LOAD = 'redux-example/LOAD';
const LOAD_SUCCESS = 'redux-example/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/LOAD_FAIL';

// Private reducer, only modifies entities themselves. State will be an entity
function entityPropertyReducer( state, action ) {

    switch( action.type ) {

        case 'CHANGE_ENTITY_MATERIAL_ID':

            return {
                ...state,
                materialId: action.newMaterialId
            };

        case 'MOVE_ENTITY':

            const { field, value } = action;
            const { position } = state;

            return {
                ...state,
                position: new THREE.Vector3(
                    field === 'x' ? value : position.x,
                    field === 'y' ? value : position.y,
                    field === 'z' ? value : position.z
                )
            };

        case 'ROTATE_ENTITY':

            const rField = action.field;
            const rValue = action.value;
            const { rotation } = state;

            return {
                ...state,
                rotation: new THREE.Vector3(
                    field === 'x' ? value : rotation.x,
                    field === 'y' ? value : rotation.y,
                    field === 'z' ? value : rotation.z
                )
            };

        default:
            return state;

    }

}

// Handles all entities. State is an object of { id: entity, ... }
export function entitiesReducer( state = {}, action = {} ) {

    switch( action.type ) {

        case 'ADD_ENTITY':

            return {
                ...state,
                [ action.id ]: {
                    id: action.id,
                    type: action.entityType,
                    position: action.position,
                    scale: action.scale,
                    rotation: action.rotation,
                    materialId: action.materialId
                }
            };

        case 'REMOVE_ENTITY':

            return without( state, action.id );

        case 'ROTATE_ENTITY':
        case 'MOVE_ENTITY':
        case 'CHANGE_ENTITY_MATERIAL_ID':

            return {
                ...state,
                [ action.id ]: entityPropertyReducer( state[ action.id ], action )
            };

        default:
            return state;
            
    }

}

// Private reducer, only modifies levels. state will be an individual level
function levelEntityReducer( state, action ) {

    switch( action.type ) {

        case 'ADD_ENTITY':
            return {
                ...state,
                entityIds: [ ...state.entityIds, action.id ]
            };

        case 'REMOVE_ENTITY':
            return {
                ...state,
                entityIds: state.entityIds.filter( id => id !== action.id )
            };

        default:
            return state;
    }

}

export function levelsReducer( state = {}, action = {} ) {

    switch( action.type ) {

        case 'ADD_LEVEL':
            return {
                ...state,
                [ action.id ]: {
                    id: action.id,
                    name: action.name,
                    entityIds: []
                }
            };

        case 'REMOVE_ENTITY':
        case 'ADD_ENTITY':
            return {
                ...state,
                [ action.levelId ]: levelEntityReducer( state[ action.levelId ], action )
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

export function currentLevelReducer( state = null, action = {} ) {

    switch( action.type ) {

        case 'ADD_LEVEL':
            return action.id;

        default:
            return state;

    }

}

// Actions
export function addLevel( name ) {
    return {
        type: 'ADD_LEVEL',
        id: Date.now(),
        name
    };
}

export function selectLevel( id ) {
    return {
        type: 'SELECT_LEVEL',
        id
    };
}

export function addEntity( levelId, entityType, position, scale, rotation, materialId ) {
    return {
        type: 'ADD_ENTITY',
        id: Date.now(),
        levelId, entityType, position, scale, rotation, materialId
    };
}

export function removeEntity( levelId, id ) {
    return {
        type: 'REMOVE_ENTITY',
        levelId, id
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

export function areLevelsLoaded( globalState ) {
    return globalState.info && globalState.info.loaded;
}
