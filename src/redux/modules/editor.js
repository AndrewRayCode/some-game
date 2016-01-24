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

const ADD_ENTITY = 'dung/ADD_ENTITY';
const ADD_LEVEL = 'dung/ADD_LEVEL';
const ADD_NEXT_LEVEL = 'dung/ADD_NEXT_LEVEL';
const CHANGE_ENTITY_MATERIAL_ID = 'dung/CHANGE_ENTITY_MATERIAL_ID';
const DESERIALIZE = 'dung/DESERIALIZE';
const EDITOR_SELECT_LEVEL = 'dung/EDITOR_SELECT_LEVEL';
const INSET_LEVEL = 'dung/INSET_LEVEL';
const MODIFY_LEVEL = 'dung/MODIFY_LEVEL';
const MOVE_ENTITY = 'dung/MOVE_ENTITY';
const REMOVE_ENTITY = 'dung/REMOVE_ENTITY';
const REMOVE_NEXT_LEVEL = 'dung/REMOVE_NEXT_LEVEL';
const ROTATE_ENTITY = 'dung/ROTATE_ENTITY';

// do NOT do this
let hasDeserialized = false;

// Private reducer, only modifies entities themselves. State will be an entity
function entityPropertyReducer( state, action ) {

    switch( action.type ) {

        case CHANGE_ENTITY_MATERIAL_ID:

            return {
                ...state,
                materialId: action.newMaterialId
            };

        case MOVE_ENTITY:

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

        case ROTATE_ENTITY:

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

        case DESERIALIZE:
            return {
                ...state,
                position: new THREE.Vector3().copy( state.position ),
                // Level entities don't have rotation saved
                rotation: state.rotation ?
                    new THREE.Quaternion( state.rotation._x, state.rotation._y, state.rotation._z, state.rotation._w ) :
                    new THREE.Quaternion( 0, 0, 0, 1 ),
                scale: new THREE.Vector3().copy( state.scale )
            };

        default:
            return state;

    }

}

// Handles all entities. State is an object of { id: entity, ... }
export function entitiesReducer( state = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...state,
                ...action.result.entities
            };

        case ADD_NEXT_LEVEL:
        case ADD_ENTITY:

            return {
                ...state,
                [ action.id ]: {
                    id: action.id,
                    type: action.entityType,
                    position: action.position,
                    scale: action.scale,
                    rotation: action.rotation || new THREE.Quaternion( 0, 0, 0, 1 ),
                    materialId: action.materialId
                }
            };

        case REMOVE_NEXT_LEVEL:

            return without( state, action.entityId );

        case REMOVE_ENTITY:

            return without( state, action.id );

        case ROTATE_ENTITY:
        case MOVE_ENTITY:
        case CHANGE_ENTITY_MATERIAL_ID:

            return {
                ...state,
                [ action.id ]: entityPropertyReducer( state[ action.id ], action )
            };

        case DESERIALIZE:
            if( hasDeserialized ) {
                return state;
            }
            hasDeserialized = true;
            return Object.keys( state ).reduce( ( memo, id ) => {
                memo[ id ] = entityPropertyReducer( state[ id ], action );
                return memo;
            }, {} );

        default:
            return state;
            
    }

}

function removeNextLevelFrom( level, entityId ) {

    return {
        ...level,
        entityIds: level.entityIds.filter( id => id !== entityId) ,
        nextLevelId: null
    };

}

// Private reducer, only modifies levels. state will be an individual level
function individualLevelReducer( level, action ) {

    switch( action.type ) {

        case ADD_NEXT_LEVEL:
        case ADD_ENTITY:
            return {
                ...level,
                nextLevelId: action.nextLevelId,
                entityIds: [ ...level.entityIds, action.id ]
            };

        case REMOVE_NEXT_LEVEL:
            return {
                ...level,
                nextLevelId: null,
                entityIds: level.entityIds.filter( id => id !== action.entityId )
            };

        case REMOVE_ENTITY:
            return {
                ...level,
                nextLevelId: action.entityType === 'level' ? null : level.nextLevelId,
                entityIds: level.entityIds.filter( id => id !== action.id )
            };

        case INSET_LEVEL:
            return {
                ...level,
                nextLevelId: action.currentLevelId,
                entityIds: [
                    ...level.entityIds.filter( id => id !== action.previousLevelNextLevelEntityIdIfAny ),
                    action.nextLevelEntityId
                ]
            };

        default:
            return level;

    }

}

// Top level levels reducer. State is a key value hash of all levels
export function levelsReducer( levels = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...levels,
                ...action.result.levels
            };

        case SAVE_SUCCESS:

            const oldLevel = levels[ action.result.oldId ];
            return {
                ...without( levels, oldLevel.id ),
                [ action.result.id ]: {
                    ...oldLevel,
                    id: action.result.id,
                    saved: true
                }
            };

        case MODIFY_LEVEL:
            return {
                ...levels,
                [ action.id ]: {
                    ...levels[ action.id ],
                    id: action.id,
                    [ action.field ]: action.value
                }
            };

        case ADD_LEVEL:
            return {
                ...levels,
                [ action.id ]: {
                    id: action.id,
                    name: action.name,
                    entityIds: []
                }
            };

        case REMOVE_NEXT_LEVEL:
        case ADD_NEXT_LEVEL:
        case REMOVE_ENTITY:
        case ADD_ENTITY:
            return {
                ...levels,
                [ action.levelId ]: individualLevelReducer( levels[ action.levelId ], action )
            };

        case INSET_LEVEL:
            return {
                ...levels,
                // remove the next level (the one we're insetting) from the
                // curent level
                [ action.currentLevelId ]: removeNextLevelFrom( levels[ action.currentLevelId ], action.nextLevelEntityId ),
                [ action.nextLevelId ]: individualLevelReducer( levels[ action.nextLevelId ], action )
            };

        default:
            return levels;

    }

}

export function editorLevelReducer( state = null, action = {} ) {

    switch( action.type ) {

        case SAVE_SUCCESS:
            return action.result.id;

        case EDITOR_SELECT_LEVEL:
            return action.id;

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
        type: ADD_LEVEL,
        id: Date.now(),
        name
    };
}

export function selectLevel( id ) {
    return {
        type: EDITOR_SELECT_LEVEL,
        id
    };
}

export function addEntity( levelId, entityType, position, scale, rotation, materialId ) {
    return {
        type: ADD_ENTITY,
        id: Date.now(),
        levelId, entityType, position, scale, rotation, materialId
    };
}

export function removeEntity( levelId, id, entityType ) {
    return {
        type: REMOVE_ENTITY,
        levelId, id, entityType
    };
}

export function moveEntity( id, field, value ) {
    return {
        type: MOVE_ENTITY,
        id, field, value
    };
}

export function rotateEntity( id, field, value ) {
    return {
        type: ROTATE_ENTITY,
        id, field, value
    };
}

export function changeEntityMaterial( id, newMaterialId ) {
    return {
        type: CHANGE_ENTITY_MATERIAL_ID,
        id, newMaterialId
    };
}

export function renameLevel( id, name ) {
    return {
        type: MODIFY_LEVEL,
        field: 'name',
        value: name,
        id
    };
}

export function addNextLevel( levelId, nextLevelId, position, scale ) {
    return {
        type: ADD_NEXT_LEVEL,
        entityType: 'level',
        id: Date.now(),
        levelId, nextLevelId, position, scale
    };
}

export function insetLevel( currentLevelId, nextLevelId, nextLevelEntityId, previousLevelNextLevelEntityIdIfAny, position, scale ) {
    return {
        type: INSET_LEVEL,
        currentLevelId, nextLevelId, nextLevelEntityId, previousLevelNextLevelEntityIdIfAny, position, scale
    };
}

export function removeNextLevel( levelId, entityId ) {
    return {
        type: REMOVE_NEXT_LEVEL,
        levelId, entityId
    };
}

export function deserializeLevels() {
    return { type: DESERIALIZE };
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
