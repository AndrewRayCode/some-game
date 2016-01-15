import THREE from 'three';
import { without } from '../../containers/Dung/Utils';

const LOAD = 'redux-example/LEVEL_LOAD';
const LOAD_SUCCESS = 'redux-example/LEVEL_LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/LEVEL_LOAD_FAIL';

const SAVE = 'redux-example/SAVE';
const SAVE_SUCCESS = 'redux-example/SAVE_SUCCESS';
const SAVE_FAIL = 'redux-example/SAVE_FAIL';

const UPDATE = 'redux-example/UPDATE';
const UPDATE_SUCCESS = 'redux-example/UPDATE_SUCCESS';
const UPDATE_FAIL = 'redux-example/UPDATE_FAIL';

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

        case LOAD_SUCCESS:
            return Object.assign( {}, state, action.result );

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

        case LOAD_SUCCESS:
            return {
                ...state,
                levels: Object.assign( {}, state.levels, action.result )
            };

        case SAVE_SUCCESS:

            const oldLevel = state[ action.result.oldId ];
            return {
                ...without( state, oldLevel.id ),
                [ action.result.id ]: {
                    ...oldLevel,
                    id: action.result.id,
                    saved: true
                }
            };

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

        default:
            return state;

    }

}

export function currentLevelReducer( state = null, action = {} ) {

    switch( action.type ) {

        case SAVE_SUCCESS:
            return action.result.id;

        case 'ADD_LEVEL':
            return action.id;

        case 'START_GAME':
            return action.levelId;

        default:
            return state;

    }

}

export function loadLevelsReducer( state = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...state,
                loaded: true
            };

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
        types: [ LOAD, LOAD_SUCCESS, LOAD_FAIL ],
        promise: client => client.get( '/loadLevels' )
    };
}

export function saveLevel( levelData, entities ) {
    return {
        types: [ SAVE, SAVE_SUCCESS, SAVE_FAIL ],
        promise: client => client.post( '/saveLevel', { data: { levelData, entities } } )
    };
}

export function updateLevel( levelData, entities ) {
    return {
        types: [ UPDATE, UPDATE_SUCCESS, UPDATE_FAIL ],
        promise: client => client.post( '/updateLevel', { data: { levelData, entities } } )
    };
}

export function areLevelsLoaded( globalState ) {

    return globalState.levelsLoaded && globalState.levelsLoaded.loaded;

}
