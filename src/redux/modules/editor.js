import THREE from 'three';
import { without, uid } from '../../helpers/Utils';

const LOAD = 'editor/LEVEL_LOAD';
const LOAD_SUCCESS = 'editor/LEVEL_LOAD_SUCCESS';
const LOAD_FAIL = 'editor/LEVEL_LOAD_FAIL';

const SAVE_LEVEL = 'editor/SAVE_LEVEL';
const SAVE_LEVEL_SUCCESS = 'editor/SAVE_LEVEL_SUCCESS';
const SAVE_LEVEL_FAIL = 'editor/SAVE_LEVEL_FAIL';

const SAVE_BOOK = 'editor/SAVE_BOOK';
const SAVE_BOOK_SUCCESS = 'editor/SAVE_BOOK_SUCCESS';
const SAVE_BOOK_FAIL = 'editor/SAVE_BOOK_FAIL';

const UPDATE_LEVEL = 'editor/UPDATE_LEVEL';
const UPDATE_LEVEL_SUCCESS = 'editor/UPDATE_LEVEL_SUCCESS';
const UPDATE_LEVEL_FAIL = 'editor/UPDATE_LEVEL_FAIL';

const UPDATE_BOOK = 'editor/UPDATE_BOOK';
const UPDATE_BOOK_SUCCESS = 'editor/UPDATE_BOOK_SUCCESS';
const UPDATE_BOOK_FAIL = 'editor/UPDATE_BOOK_FAIL';

const ADD_ENTITY = 'editor/ADD_ENTITY';
const CHANGE_ENTITY_MATERIAL_ID = 'editor/CHANGE_ENTITY_MATERIAL_ID';
const CHANGE_ENTITY_WRAP_MATERIAL_ID = 'editor/CHANGE_ENTITY_WRAP_MATERIAL_ID';
const CHANGE_ENTITY_TOP_MATERIAL_ID = 'editor/CHANGE_ENTITY_TOP_MATERIAL_ID';
const CHANGE_ENTITY_FOAM_MATERIAL_ID = 'editor/CHANGE_ENTITY_FOAM_MATERIAL_ID';
const CHANGE_ENTITY_TYPE = 'editor/CHANGE_ENTITY_TYPE';
const DESERIALIZE = 'editor/DESERIALIZE';
const EDITOR_SELECT_LEVEL_AND_CHAPTER = 'editor/EDITOR_SELECT_LEVEL_AND_CHAPTER';
const MODIFY_LEVEL = 'editor/MODIFY_LEVEL';
const MOVE_ENTITY = 'editor/MOVE_ENTITY';
const REMOVE_ENTITY = 'editor/REMOVE_ENTITY';
const REMOVE_NEXT_CHAPTER = 'editor/REMOVE_NEXT_CHAPTER';
const ROTATE_ENTITY = 'editor/ROTATE_ENTITY';

const INSET_CHAPTER = 'editor/INSET_CHAPTER';
const CREATE_CHAPTER_FROM_LEVEL = 'editor/CREATE_CHAPTER_FROM_LEVEL';
const MODIFY_CHAPTER = 'editor/MODIFY_CHAPTER';
const CREATE_LEVEL_AND_CHAPTER = 'editor/CREATE_LEVEL_AND_CHAPTER';
const ADD_NEXT_CHAPTER = 'editor/ADD_NEXT_CHAPTER';

const CREATE_BOOK = 'editor/CREATE_BOOK';
const MODIFY_BOOK = 'editor/MODIFY_BOOK';
const EDITOR_SELECT_BOOK = 'editor/EDITOR_SELECT_BOOK';

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

        case CHANGE_ENTITY_FOAM_MATERIAL_ID:

            return {
                ...entity,
                foamMaterialId: action.newFoamMaterialId
            };

        case CHANGE_ENTITY_WRAP_MATERIAL_ID:

            return {
                ...entity,
                wrapMaterialId: action.newWrapMaterialId
            };

        case CHANGE_ENTITY_TOP_MATERIAL_ID:

            return {
                ...entity,
                topMaterialId: action.newTopMaterialId
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

            const { rotation } = entity;

            return {
                ...entity,
                rotation: new THREE.Vector3(
                    field === 'x' ? value : rotation.x,
                    field === 'y' ? value : rotation.y,
                    field === 'z' ? value : rotation.z
                )
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

        case REMOVE_ENTITY:

            return without( entities, action.id );

        case ROTATE_ENTITY:
        case MOVE_ENTITY:
        case CHANGE_ENTITY_TYPE:
        case CHANGE_ENTITY_MATERIAL_ID:
        case CHANGE_ENTITY_FOAM_MATERIAL_ID:
        case CHANGE_ENTITY_WRAP_MATERIAL_ID:
        case CHANGE_ENTITY_TOP_MATERIAL_ID:

            return {
                ...entities,
                [ action.id ]: entityPropertyReducer( entities[ action.id ], action )
            };

        case DESERIALIZE:
            return Object.keys( entities ).reduce( ( memo, id ) => ({
                ...memo,
                [ id ]: entityPropertyReducer( entities[ id ], action )
            }), {} );

        default:
            return entities;
            
    }

}

/**
 * Levels
 */

// Private reducer, only modifies levels. state will be an individual level
function individualLevelReducer( level, action ) {

    switch( action.type ) {

        case ADD_ENTITY:
            return {
                ...level,
                entityIds: [ ...level.entityIds, action.id ]
            };

        case REMOVE_ENTITY:
            return {
                ...level,
                entityIds: level.entityIds.filter( id => id !== action.id )
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

        case UPDATE_LEVEL_FAIL:
        case SAVE_LEVEL_FAIL:

            console.error( 'Levels api fail', action );
            return levels;

        case SAVE_LEVEL_SUCCESS:

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
                    [ action.field ]: action.value
                }
            };

        case CREATE_LEVEL_AND_CHAPTER:
            return {
                ...levels,
                [ action.levelId ]: {
                    id: action.levelId,
                    name: action.name,
                    entityIds: []
                }
            };

        case REMOVE_ENTITY:
        case ADD_ENTITY:
            return {
                ...levels,
                [ action.levelId ]: individualLevelReducer( levels[ action.levelId ], action )
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

/**
 * Chapters
 */

function removeNextChapterFrom( chapter, nextChapterId ) {

    return {
        ...chapter,
        nextChapters: chapter.nextChapters.filter(
            nextChapter => nextChapter.id !== nextChapterId
        )
    };

}

function individualChapterReducer( chapter, action ) {

    switch( action.type ) {

        case INSET_CHAPTER:
        case ADD_NEXT_CHAPTER:
            return {
                ...chapter,
                nextChapters: [
                    ...chapter.nextChapters,
                    {
                        id: action.id,
                        chapterId: action.nextChapterId,
                        position: action.position,
                        scale: action.scale
                    }
                ]
            };

        case DESERIALIZE:
            return {
                ...chapter,
                nextChapters: chapter.nextChapters.map( nextChapter => ({
                    ...nextChapter,
                    position: new THREE.Vector3().copy( nextChapter.position ),
                    rotation: nextChapter.rotation ?
                        new THREE.Quaternion( nextChapter.rotation._x, nextChapter.rotation._y, nextChapter.rotation._z, nextChapter.rotation._w ) :
                        new THREE.Quaternion( 0, 0, 0, 1 ),
                    scale: new THREE.Vector3().copy( nextChapter.scale )
                }) )
            };

        case REMOVE_NEXT_CHAPTER:
            return removeNextChapterFrom( chapter, action.nextChapterId );

        default:
            return chapter;

    }

}

// Handle all normalized chapters. chapters is a key value hash of all chapters
export function chaptersReducer( chapters = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...chapters,
                ...action.result.chapters
            };

        case INSET_CHAPTER:
        case ADD_NEXT_CHAPTER:
        case REMOVE_NEXT_CHAPTER:
            return {
                ...chapters,
                [ action.chapterId ]: individualChapterReducer( chapters[ action.chapterId ], action ),
            };

        case CREATE_CHAPTER_FROM_LEVEL:
            return {
                ...chapters,
                [ action.chapterId ]: {
                    id: action.chapterId,
                    name: 'Chapter for ' + action.name,
                    levelId: action.levelId,
                    nextChapters: []
                }
            };

        case CREATE_LEVEL_AND_CHAPTER:
            return {
                ...chapters,
                [ action.chapterId ]: {
                    id: action.chapterId,
                    name: 'Chapter for ' + action.name,
                    levelId: action.levelId,
                    nextChapters: []
                }
            };

        // A chapter contains a reference to a level id. We need to update that
        // id on level save, because levelId changes
        case SAVE_LEVEL_SUCCESS:
            return Object.keys( chapters ).reduce( ( memo, id ) => {

                if( chapters[ id ].levelId === action.result.oldLevelId ) {

                    memo[ id ] = {
                        ...chapters[ id ],
                        levelId: action.result.newLevelId
                    };

                } else {

                    memo[ id ] = chapters[ id ];

                }

                return memo;

            }, {} );

        case MODIFY_CHAPTER:
            return {
                ...chapters,
                [ action.id ]: {
                    ...chapters[ action.id ],
                    [ action.field ]: action.value
                }
            };

        case DESERIALIZE:
            return Object.keys( chapters ).reduce( ( memo, id ) => ({
                ...memo,
                [ id ]: individualChapterReducer( chapters[ id ], action )
            }), {} );

        default:
            return chapters;

    }

}

/**
 * Books
 */

function individualBookReducer( book = {}, action ) {

    switch( action.type ) {

        // Currently level id is just duplicated to chapter id, because they're
        // in different domains
        case CREATE_CHAPTER_FROM_LEVEL:
        case CREATE_LEVEL_AND_CHAPTER:
            return {
                ...book,
                chapterIds: [
                    ...book.chapterIds,
                    action.chapterId
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

        case SAVE_BOOK_FAIL:
            console.error( 'Save error', action );
            return books;

        case SAVE_BOOK_SUCCESS:

            const oldBook = books[ action.result.oldBookId ];
            return {
                ...without( books, oldBook.id ),
                [ action.result.newBookId ]: {
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
                    chapterIds: []
                }
            };

        case CREATE_CHAPTER_FROM_LEVEL:
        case CREATE_LEVEL_AND_CHAPTER:
            return {
                ...books,
                [ action.bookId ]: individualBookReducer( books[ action.bookId ], action )
            };

        // TODO
        //case INSET_CHAPTER:
            //return {
                //...books,
                //// remove the next level (the one we're insetting) from the
                //// curent level
                //[ action.currentLevelId ]: removeNextChapterFrom( books[ action.currentLevelId ], action.previousLevelNextLevelEntityIdIfAny, action.nextLevelEntityId ),
                //[ action.nextChapterId ]: individualLevelReducer( books[ action.nextChapterId ], action )
            //};

        default:
            return books;

    }

}

/**
 * Selected things
 */

export function editorSelectedBookReducer( state = null, action = {} ) {

    switch( action.type ) {

        // Creating a book should auto-select it
        case CREATE_BOOK:
        case EDITOR_SELECT_BOOK:
            return action.id;

        // Select the newest id because it will change
        case SAVE_BOOK_SUCCESS:
            return action.result.newBookId;

        default:
            return state;

    }

}

export function editorSelectedLevelReducer( levelId = null, action = {} ) {

    switch( action.type ) {

        // Select the newest id because it will change
        case SAVE_LEVEL_SUCCESS:
            return action.result.newLevelId;

        case CREATE_LEVEL_AND_CHAPTER:
        case EDITOR_SELECT_LEVEL_AND_CHAPTER:
            return action.levelId;

        // Reset selected level on new book selection
        case EDITOR_SELECT_BOOK:
        case CREATE_BOOK:
            return null;

        default:
            return levelId;

    }

}

export function editorSelectedChapterReducer( chapterId = null, action = {} ) {

    switch( action.type ) {

        // Auto select the chapter when created with a level
        case CREATE_LEVEL_AND_CHAPTER:
        case EDITOR_SELECT_LEVEL_AND_CHAPTER:
            return action.chapterId;

        // Reset selected chapter on new book selection
        case EDITOR_SELECT_BOOK:
        case CREATE_BOOK:
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
        id: uid(),
        name
    };
}

export function selectBook( id ) {
    return {
        type: EDITOR_SELECT_BOOK,
        id
    };
}

export function createChapterFromLevel( name, levelId, bookId ) {
    return {
        type: CREATE_CHAPTER_FROM_LEVEL,
        chapterId: uid(),
        levelId, bookId, name
    };
}

export function createLevel( name, bookId ) {
    return {
        type: CREATE_LEVEL_AND_CHAPTER,
        levelId: uid(),
        chapterId: uid(),
        bookId, name
    };
}

export function selectLevelAndChapter( levelId, chapterId ) {
    return {
        type: EDITOR_SELECT_LEVEL_AND_CHAPTER,
        levelId, chapterId
    };
}

export function addEntity( levelId, entityType, position, scale, rotation, materialId ) {
    return {
        type: ADD_ENTITY,
        id: uid(),
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

export function changeEntityFoamMaterial( id, newFoamMaterialId ) {
    return {
        type: CHANGE_ENTITY_FOAM_MATERIAL_ID,
        id, newFoamMaterialId
    };
}

export function changeEntityWrapMaterial( id, newWrapMaterialId ) {
    return {
        type: CHANGE_ENTITY_WRAP_MATERIAL_ID,
        id, newWrapMaterialId
    };
}

export function changeEntityTopMaterial( id, newTopMaterialId ) {
    return {
        type: CHANGE_ENTITY_TOP_MATERIAL_ID,
        id, newTopMaterialId
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

export function renameBook( id, name ) {
    return {
        type: MODIFY_BOOK,
        field: 'name',
        value: name,
        id
    };
}

export function renameChapter( id, name ) {
    return {
        type: MODIFY_CHAPTER,
        field: 'name',
        value: name,
        id
    };
}

export function addNextChapter( chapterId, nextChapterId, position, scale ) {
    return {
        type: ADD_NEXT_CHAPTER,
        id: uid(),
        chapterId, nextChapterId, position, scale
    };
}

export function removeNextChapter( chapterId, nextChapterId ) {
    return {
        type: REMOVE_NEXT_CHAPTER,
        chapterId, nextChapterId
    };
}

export function insetChapter( nextChapterId, nextLevelEntityId, previousLevelNextLevelEntityIdIfAny, position, scale ) {
    alert('todo');
    return {};
        //type: INSET_CHAPTER,
        //currentLevelId, nextChapterId, nextLevelEntityId,
        //previousLevelNextLevelEntityIdIfAny, position, scale
    //};
}

export function deserializeLevels() {
    return { type: DESERIALIZE };
}

export function loadAllBooks() {
    return {
        types: [ LOAD, LOAD_SUCCESS, LOAD_FAIL ],
        promise: client => client.get( '/loadAllBooks' )
    };
}

export function saveLevel( levelData, entities ) {
    return {
        types: [ SAVE_LEVEL, SAVE_LEVEL_SUCCESS, SAVE_LEVEL_FAIL ],
        promise: client => client.post( '/saveLevel', { data: { levelData, entities } } )
    };
}

export function saveBook( bookData, chapters ) {
    return {
        types: [ SAVE_BOOK, SAVE_BOOK_SUCCESS, SAVE_BOOK_FAIL ],
        promise: client => client.post( '/saveBook', { data: { bookData, chapters } } )
    };
}

export function updateLevel( levelData, entities ) {
    return {
        types: [ UPDATE_LEVEL, UPDATE_LEVEL_SUCCESS, UPDATE_LEVEL_FAIL ],
        promise: client => client.post( '/updateLevel', { data: { levelData, entities } } )
    };
}

export function updateBook( bookData, chapters ) {
    return {
        types: [ UPDATE_BOOK, UPDATE_BOOK_SUCCESS, UPDATE_BOOK_FAIL ],
        promise: client => client.post( '/updateBook', { data: { bookData, chapters } } )
    };
}

export function saveAll( levelData, entities, bookData, chapters ) {

    return ( dispatch, getState ) =>
        dispatch( levelData.saved ?
            updateLevel( levelData, entities ) :
            saveLevel( levelData, entities )
        ).then( () => {
            // When a level is saved, it gets a new id. All chapters will then
            // get their levelIds updated. The problem is that the chapters
            // passed to us are now stale. So get the newest one from updated
            // state! They will have latest levelId
            const { chapters: allChapters } = getState();
            const updatedChapters = Object.keys( chapters ).reduce(
                ( memo, id ) => ({
                    ...memo,
                    [ id ]: allChapters[ id ]
                }), {}
            );
            return dispatch( bookData.saved ?
                updateBook( bookData, updatedChapters ) :
                saveBook( bookData, updatedChapters )
            );

        });

}

export function areBooksLoaded( globalState ) {

    return globalState.levelsLoaded && globalState.levelsLoaded.loaded;

}

export function changeEntityType( id, newType ) {
    return {
        type: CHANGE_ENTITY_TYPE,
        id, newType
    };
}
