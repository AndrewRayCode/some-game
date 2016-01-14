import { combineReducers } from 'redux';
import multireducer from 'multireducer';
import { routerStateReducer } from 'redux-router';

import auth from './auth';
import counter from './counter';
import {reducer as form} from 'redux-form';
import info from './info';
import widgets from './widgets';
import game from './game';
import { levelsReducer, entitiesReducer, currentLevelReducer } from './editor';

export default combineReducers({
    router: routerStateReducer,
    auth,
    form,
    levels: levelsReducer,
    entities: entitiesReducer,
    currentLevel: currentLevelReducer,
    game,
    multireducer: multireducer({
        counter1: counter,
        counter2: counter,
        counter3: counter
    }),
    info,
    widgets
});
