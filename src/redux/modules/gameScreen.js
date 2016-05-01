const PAUSE_GAME = 'game/PAUSE_GAME';
const UNPAUSE_GAME = 'game/UNPAUSE_GAME';
const SHOW_CONFIRM_MENU_SCREEN = 'game/SHOW_CONFIRM_MENU_SCREEN';
const EXIT_MENU_DENY = 'game/EXIT_MENU_DENY';
const SHOW_CONFIRM_RESTART_SCREEN = 'game/SHOW_CONFIRM_RESTART_SCREEN';
const EXIT_TO_MENU_CONFIRM = 'game/EXIT_TO_MENU_CONFIRM';
const CONFIRM_RESTART = 'game/CONFIRM_RESTART';
const DENY_RESTART = 'game/DENY_RESTART';

// This is duplicated in game.js and should be abstracted out to constants file
const START_GAME = 'game/START_GAME';
const RESTART_CHAPTER = 'game/RESTART_CHAPTER';

import KeyHandler from 'helpers/KeyHandler';

const defaultScreenState = {
    paused: false,
    confirmingRestart: false,
    confirmingMenu: false,
};
export function gameScreenReducer( state = defaultScreenState, action = {} ) {

    switch( action.type ) {

        case START_GAME:
        case RESTART_CHAPTER:
        case EXIT_TO_MENU_CONFIRM:
        case CONFIRM_RESTART:
        case UNPAUSE_GAME:
            return defaultScreenState;

        case EXIT_MENU_DENY:
        case DENY_RESTART:
        case PAUSE_GAME:
            return {
                paused: true
            };

        case SHOW_CONFIRM_MENU_SCREEN:
            return {
                paused: true,
                confirmingRestart: false,
                confirmingMenu: true,
            };

        case SHOW_CONFIRM_RESTART_SCREEN:
            return {
                paused: true,
                confirmingRestart: true,
            };

        default:
            return state;

    }

}

export function pauseGame() {
    // There's a tricky flow we need to be aware of.
    // 1. request animation frame callback
    // 2. is pause key pressed?
    // 3. dispatch pause action
    // 4. pause screen component mounts
    // 5. onAnimate is registered during the same rAF(!)
    // 6. onAnimate checks "is unpause key pressed?"
    // 7. Unpause is fired
    // All before the rAF finishes, which is where the global keyhandler unsets
    // which keys are first pressed and which are repeated. re-set it manually
    // for now?
    KeyHandler.updateFirstPressed();
    return { type: PAUSE_GAME, };
}

export function unpauseGame() {
    KeyHandler.updateFirstPressed();
    return { type: UNPAUSE_GAME, };
}

export function showConfirmMenuScreen() {
    KeyHandler.updateFirstPressed();
    return { type: SHOW_CONFIRM_MENU_SCREEN, };
}

export function exitToMenuDeny() {
    KeyHandler.updateFirstPressed();
    return { type: EXIT_MENU_DENY, };
}

export function showConfirmRestartScreen() {
    KeyHandler.updateFirstPressed();
    return { type: SHOW_CONFIRM_RESTART_SCREEN, };
}

export function exitToMenuConfirm() {
    KeyHandler.updateFirstPressed();
    return { type: EXIT_TO_MENU_CONFIRM, };
}

export function confirmingRestart() {
    KeyHandler.updateFirstPressed();
    return { type: CONFIRM_RESTART, };
    // todo probably get these from passing?
    //const {
        //currentChapterId, originalEntities, originalLevels, chapters, books
    //} = this.props;

    //this.props.restartChapter(
        //currentChapterId, originalEntities, originalLevels, chapters, books
    //);
}

export function denyRestart() {
    KeyHandler.updateFirstPressed();
    return { type: DENY_RESTART, };
}

