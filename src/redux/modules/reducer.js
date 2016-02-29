import { combineReducers } from 'redux';
import multireducer from 'multireducer';
import { routerStateReducer } from 'redux-router';

import auth from './auth';
import { reducer as form } from 'redux-form';
import { assetsReducer, shadersReducer } from './assets';
import { game, gameChapterReducer, gameBookReducer } from './game';
import {
    loadLevelsReducer, levelsReducer, entitiesReducer,
    editorSelectedLevelReducer, booksReducer, chaptersReducer,
    editorSelectedBookReducer, editorSelectedChapterReducer
} from './editor';

export default combineReducers({
    router: routerStateReducer,
    auth,
    form,

    // editor
    levelsLoaded: loadLevelsReducer,
    books: booksReducer,
    chapters: chaptersReducer,
    levels: levelsReducer,
    assets: assetsReducer,
    shaders: shadersReducer,
    entities: entitiesReducer,

    currentEditorLevel: editorSelectedLevelReducer,
    currentEditorBook: editorSelectedBookReducer,
    currentEditorChapter: editorSelectedChapterReducer,

    // game
    gameChapterData: gameChapterReducer,
    currentGameBook: gameBookReducer,
    game,
});
