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
const CREATE_LEVEL = 'dung/CREATE_LEVEL';
const ADD_NEXT_LEVEL = 'dung/ADD_NEXT_LEVEL';
const CHANGE_ENTITY_MATERIAL_ID = 'dung/CHANGE_ENTITY_MATERIAL_ID';
const CHANGE_ENTITY_TYPE = 'dung/CHANGE_ENTITY_TYPE';
const DESERIALIZE = 'dung/DESERIALIZE';
const EDITOR_SELECT_LEVEL = 'dung/EDITOR_SELECT_LEVEL';
const MODIFY_LEVEL = 'dung/MODIFY_LEVEL';
const MOVE_ENTITY = 'dung/MOVE_ENTITY';
const REMOVE_ENTITY = 'dung/REMOVE_ENTITY';
const REMOVE_NEXT_LEVEL = 'dung/REMOVE_NEXT_LEVEL';
const ROTATE_ENTITY = 'dung/ROTATE_ENTITY';

const INSET_CHAPTER = 'dung/INSET_CHAPTER';
const CREATE_CHAPTER = 'dung/CREATE_CHAPTER';
const MODIFY_CHAPTER = 'dung/MODIFY_CHAPTER';
const SELECT_CHAPTER = 'dung/SELECT_CHAPTER';

const CREATE_BOOK = 'dung/CREATE_BOOK';
const MODIFY_BOOK = 'dung/MODIFY_BOOK';
const EDITOR_SELECT_BOOK = 'dung/EDITOR_SELECT_BOOK';

// Private reducer, only modifies entities themselves. State will be an entity
function entityPropertyReducer( entity, action ) {

    switch( action.type ) {

        case CHANGE_ENTITY_TYPE:

            return {
                ...entity,
                type: action.newType
            };

        case CHANGE_ENTITY_MATERIAL_ID:

            return {
                ...entity,
                materialId: action.newMaterialId
            };

        case MOVE_ENTITY:

            const { field, value } = action;
            const { position } = entity;

            return {
                ...entity,
                position: new THREE.Vector3(
                    field === 'x' ? value : position.x,
                    field === 'y' ? value : position.y,
                    field === 'z' ? value : position.z
                )
            };

        case ROTATE_ENTITY:

            const rField = action.field;
            const rValue = action.value;
            const { rotation } = entity;

            return {
                ...entity,
                rotation: new THREE.Vector3(
                    field === 'x' ? value : rotation.x,
                    field === 'y' ? value : rotation.y,
                    field === 'z' ? value : rotation.z
                )
            };

        case INSET_CHAPTER:
            return {
                ...entity,
                position: action.position,
                scale: action.scale
            };

        case DESERIALIZE:
            return {
                ...entity,
                id: entity.id.toString(),
                position: new THREE.Vector3().copy( entity.position ),
                // Level entities don't have rotation saved
                rotation: entity.rotation ?
                    new THREE.Quaternion( entity.rotation._x, entity.rotation._y, entity.rotation._z, entity.rotation._w ) :
                    new THREE.Quaternion( 0, 0, 0, 1 ),
                scale: new THREE.Vector3().copy( entity.scale )
            };

        default:
            return entity;

    }

}

// Handles all entities. State is an object of { id: entity, ... }
export function entitiesReducer( entities = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...entities,
                ...action.result.entities
            };

        case ADD_NEXT_LEVEL:
        case ADD_ENTITY:

            return {
                ...entities,
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

            return without( entities, action.nextLevelEntityId );

        case REMOVE_ENTITY:

            return without( entities, action.id );

        case ROTATE_ENTITY:
        case MOVE_ENTITY:
        case CHANGE_ENTITY_TYPE:
        case CHANGE_ENTITY_MATERIAL_ID:

            return {
                ...entities,
                [ action.id ]: entityPropertyReducer( entities[ action.id ], action )
            };

        case INSET_CHAPTER:
            return {
                ...entities,
                [ action.nextLevelEntityId ]: entityPropertyReducer( entities[ action.nextLevelEntityId ], action )
            };

        case DESERIALIZE:
            return Object.keys( entities ).reduce( ( memo, id ) => {
                memo[ id ] = entityPropertyReducer( entities[ id ], action );
                return memo;
            }, {} );

        default:
            return entities;
            
    }

}

function removeNextLevelFrom( level, nextLevelId ) {

    const nextData = level.nextLevels.find( data => data.levelid === nextLevelId );

    return {
        ...level,
        entityIds: level.entityIds.filter( id => id !== nextData.entityId ),
        nextLevelIds: level.nextLevelIds.filter( data => data.levelId !== nextLevelId )
    };

}

// Private reducer, only modifies levels. state will be an individual level
function individualLevelReducer( level, action ) {

    switch( action.type ) {

        case ADD_NEXT_LEVEL:
            return {
                ...level,
                nextLevelIds: [ ...level.nextLevelIds, {
                    levelId: action.nextLevelId,
                    entityId: action.id,
                } ],
                entityIds: [ ...level.entityIds, action.id ]
            };

        case ADD_ENTITY:
            return {
                ...level,
                entityIds: [ ...level.entityIds, action.id ]
            };

        case REMOVE_NEXT_LEVEL:
            return removeNextLevelFrom( level, action.nextLevelId, action.nextLevelEntityId );

        case REMOVE_ENTITY:
            return {
                ...level,
                entityIds: level.entityIds.filter( id => id !== action.id )
            };

        case INSET_CHAPTER:
            return {
                ...level,
                nextLevelIds: [ ...level.nextLevelIds, {
                    levelId: action.currentLevelId,
                    entityId: action.nextLevelEntityId,
                }],
                entityIds: [
                    ...level.entityIds.filter( id => id !== action.previousLevelNextLevelEntityIdIfAny ),
                    action.nextLevelEntityId
                ]
            };

        case DESERIALIZE:
            // Levacy levels could have numeric IDs
            return {
                ...level,
                id: level.id.toString(),
                entityIds: level.entityIds.map( id => id.toString() )
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

            const oldLevel = levels[ action.result.oldLevelId ];
            return {
                ...without( levels, oldLevel.id ),
                [ action.result.newLevelId ]: {
                    ...oldLevel,
                    id: action.result.newLevelId,
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

        case CREATE_LEVEL:
            return {
                ...levels,
                [ action.id ]: {
                    id: action.id,
                    name: action.name,
                    entityIds: [],
                    nextLevelIds: []
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

        case INSET_CHAPTER:
            return {
                ...levels,
                // remove the next level (the one we're insetting) from the
                // curent level
                [ action.currentLevelId ]: removeNextLevelFrom( levels[ action.currentLevelId ], action.previousLevelNextLevelEntityIdIfAny, action.nextLevelEntityId ),
                [ action.nextLevelId ]: individualLevelReducer( levels[ action.nextLevelId ], action )
            };

        case DESERIALIZE:
            return Object.keys( levels ).reduce( ( memo, id ) => {
                memo[ id ] = individualLevelReducer( levels[ id ], action );
                return memo;
            }, {} );


        default:
            return levels;

    }

}

// Handle all normalized chapters. chapters is a key value hash of all chapters
export function chaptersReducer( chapters = {}, action = {} ) {

    switch( action.type ) {

        case CREATE_CHAPTER:
            return {
                ...chapters,
                [ action.id ]: {
                    id: action.id,
                    name: action.name,
                    levelId: action.id,
                    nextChapters: []
                }
            };

        case CREATE_LEVEL:
            return {
                ...chapters,
                [ action.id ]: {
                    id: action.id,
                    name: 'Chapter for ' + action.name,
                    levelId: action.id,
                    nextChapters: []
                }
            };

        default:
            return chapters;

    }

}

function individualBookReducer( book = {}, action ) {

    switch( action.type ) {

        // Currently level id is just duplicated to chapter id, because they're
        // in different domains
        case CREATE_LEVEL:
            return {
                ...book,
                chapterIds: [
                    ...book.chapterIds,
                    action.id
                ]
            };

        default:
            return book;

    }
}

export function booksReducer( books = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...books,
                ...action.result.books
            };

        case SAVE_SUCCESS:

            const oldBook = books[ action.result.oldBookId ];
            return {
                ...without( books, oldBook.id ),
                [ action.result.id ]: {
                    ...oldBook,
                    id: action.result.newBookId,
                    saved: true
                }
            };

        case MODIFY_BOOK:
            return {
                ...books,
                [ action.id ]: {
                    ...books[ action.id ],
                    id: action.id,
                    [ action.field ]: action.value
                }
            };

        case CREATE_BOOK:
            return {
                ...books,
                [ action.id ]: {
                    id: action.id,
                    name: action.name,
                    chapterIds: [],
                    nextBookIds: []
                }
            };

        case CREATE_LEVEL:
            return {
                ...books,
                [ action.bookId ]: individualBookReducer( books[ action.bookId ], action )
            };

        case REMOVE_NEXT_LEVEL:
        case ADD_NEXT_LEVEL:
            return {
                ...books,
                [ action.bookId ]: individualBookReducer( books[ action.bookId ], action )
            };

        case INSET_CHAPTER:
            return {
                ...books,
                // remove the next level (the one we're insetting) from the
                // curent level
                [ action.currentLevelId ]: removeNextLevelFrom( books[ action.currentLevelId ], action.previousLevelNextLevelEntityIdIfAny, action.nextLevelEntityId ),
                [ action.nextLevelId ]: individualLevelReducer( books[ action.nextLevelId ], action )
            };


        default:
            return books;

    }

}

export function editorSelectedBookReducer( state = null, action = {} ) {

    switch( action.type ) {

        // Creating a book should auto-select it
        case CREATE_BOOK:
        case EDITOR_SELECT_BOOK:
            return action.id;

        default:
            return state;

    }

}

export function editorSelectedLevelReducer( levelId = null, action = {} ) {

    switch( action.type ) {

        case SAVE_SUCCESS:
            return action.result.id;

        case CREATE_LEVEL:
        case EDITOR_SELECT_LEVEL:
            return action.id;

        // Reset selected level on new book selection
        case EDITOR_SELECT_BOOK:
            return null;

        default:
            return levelId;

    }

}

export function editorSelectedChapterReducer( chapterId = null, action = {} ) {

    switch( action.type ) {

        //case SAVE_SUCCESS:
            //return action.result.id;

        // The chapter id and level id are identical and we auto-select level
        // and chapter on level creation
        case CREATE_LEVEL:
            return action.id;

        case EDITOR_SELECT_LEVEL:
            return action.chapterId;

        // Reset selected chapter on new book selection
        case EDITOR_SELECT_BOOK:
            return null;


        default:
            return chapterId;

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
export function createBook( name ) {
    return {
        type: CREATE_BOOK,
        id: Date.now().toString(),
        name
    };
}

export function selectBook( id ) {
    return {
        type: EDITOR_SELECT_BOOK,
        id
    };
}

export function createChapter( name, levelId ) {
    return {
        type: CREATE_CHAPTER,
        id: Date.now().toString(),
        levelId, name
    };
}

export function selectChapter( id ) {
    return {
        type: SELECT_CHAPTER,
        id
    };
}

export function createLevel( name, bookId ) {
    return {
        type: CREATE_LEVEL,
        id: Date.now().toString(),
        bookId, name
    };
}

export function selectLevel( id, chapterId ) {
    return {
        type: EDITOR_SELECT_LEVEL,
        id, chapterId
    };
}

export function addEntity( levelId, entityType, position, scale, rotation, materialId ) {
    return {
        type: ADD_ENTITY,
        id: Date.now().toString(),
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
        id: Date.now().toString(),
        levelId, nextLevelId, position, scale
    };
}

export function insetChapter( currentLevelId, nextLevelId, nextLevelEntityId, previousLevelNextLevelEntityIdIfAny, position, scale ) {
    return {
        type: INSET_CHAPTER,
        currentLevelId, nextLevelId, nextLevelEntityId,
        previousLevelNextLevelEntityIdIfAny, position, scale
    };
}

export function removeNextBook( levelId, nextLevelId, nextLevelEntityId ) {
    return {
        type: REMOVE_NEXT_LEVEL,
        levelId, nextLevelId, nextLevelEntityId
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

export function saveLevelAndBook( levelData, entities, bookData ) {
    return {
        types: [ SAVE, SAVE_SUCCESS, SAVE_FAIL ],
        promise: client => client.post( '/saveLevelAndBook', { data: { levelData, entities, bookData } } )
    };
}

export function updateLevelAndBook( levelData, entities, bookData ) {
    return {
        types: [ UPDATE, UPDATE_SUCCESS, UPDATE_FAIL ],
        promise: client => client.post( '/updateLevelAndBook', { data: { levelData, entities } } )
    };
}

export function areLevelsLoaded( globalState ) {

    return globalState.levelsLoaded && globalState.levelsLoaded.loaded;

}

export function changeEntityType( id, newType ) {
    return {
        type: CHANGE_ENTITY_TYPE,
        id, newType
    };
}
