const PAUSE_GAME = 'game/PAUSE_GAME';
const UNPAUSE_GAME = 'game/UNPAUSE_GAME';
const SHOW_CONFIRM_MENU_SCREEN = 'game/SHOW_CONFIRM_MENU_SCREEN';
const EXIT_MENU_DENY = 'game/EXIT_MENU_DENY';
const SHOW_CONFIRM_RESTART_SCREEN = 'game/SHOW_CONFIRM_RESTART_SCREEN';
const EXIT_TO_MENU_CONFIRM = 'game/EXIT_TO_MENU_CONFIRM';
const CONFIRM_RESTART = 'game/CONFIRM_RESTART';
const DENY_RESTART = 'game/DENY_RESTART';
const SHOW_CONFIRM_RESTART_BOOK = 'game/SHOW_CONFIRM_RESTART_BOOK';
const DENY_RESTART_BOOK = 'game/DENY_RESTART_BOOK';

// This is duplicated in game.js and should be abstracted out to constants file
const START_GAME = 'game/START_GAME';
const RESTART_CHAPTER = 'game/RESTART_CHAPTER';

import KeyHandler from 'helpers/KeyHandler';

const defaultScreenState = {
    paused: false,
    confirmingRestart: false,
    confirmingMenu: false,
    confirmingRestartBook: false,
};
export function gameScreenReducer( state = defaultScreenState, action = {} ) {

    switch( action.type ) {

        case START_GAME:
        case RESTART_CHAPTER:
        case EXIT_TO_MENU_CONFIRM:
        case CONFIRM_RESTART:
        case CONFIRM_RESTART_BOOK:
        case UNPAUSE_GAME: {
            return defaultScreenState;
        }

        case DENY_RESTART_BOOK:
        case EXIT_MENU_DENY:
        case DENY_RESTART:
        case PAUSE_GAME: {
            return {
                paused: true
            };
        }

        case SHOW_CONFIRM_MENU_SCREEN: {
            return {
                paused: true,
                confirmingRestart: false,
                confirmingMenu: true,
            };
        }

        case SHOW_CONFIRM_RESTART_SCREEN: {
            return {
                paused: true,
                confirmingRestart: true,
            };
        }

        case SHOW_CONFIRM_RESTART_BOOK: {
            return {
                paused: true,
                confirmingRestartBook: true,
            };
        }

        default: {
            return state;
        }

    }

}

export function pauseGame() {
    return { type: PAUSE_GAME, };
}

export function unpauseGame() {
    return { type: UNPAUSE_GAME, };
}

export function showConfirmMenuScreen() {
    return { type: SHOW_CONFIRM_MENU_SCREEN, };
}

export function exitToMenuDeny() {
    return { type: EXIT_MENU_DENY, };
}

export function showConfirmRestartScreen() {
    return { type: SHOW_CONFIRM_RESTART_SCREEN, };
}

export function exitToMenuConfirm() {
    return { type: EXIT_TO_MENU_CONFIRM, };
}

export function confirmingRestart() {
    return { type: CONFIRM_RESTART, };
}

export function denyRestart() {
    return { type: DENY_RESTART, };
}

export function showConfirmRestartBookMenuScreen() {
    return { type: SHOW_CONFIRM_RESTART_BOOK, };
}

export function denyRestartBook() {
    return { type: DENY_RESTART_BOOK, };
}
