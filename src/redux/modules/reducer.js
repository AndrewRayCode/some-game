import { combineReducers } from 'redux';
import multireducer from 'multireducer';
import { routerStateReducer } from 'redux-router';

import auth from './auth';
import counter from './counter';
import {reducer as form} from 'redux-form';
import info from './info';
import widgets from './widgets';
import { assetsReducer } from './assets';
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
    entities: entitiesReducer,

    currentEditorLevel: editorSelectedLevelReducer,
    currentEditorBook: editorSelectedBookReducer,
    currentEditorChapter: editorSelectedChapterReducer,

    // game
    currentGameChapter: gameChapterReducer,
    currentGameBook: gameBookReducer,
    game,

    multireducer: multireducer({
        counter1: counter,
        counter2: counter,
        counter3: counter
    }),
    info,
    widgets
});
