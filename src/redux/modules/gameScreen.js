const PAUSE_GAME = 'game/PAUSE_GAME';
const UNPAUSE_GAME = 'game/UNPAUSE_GAME';
const SHOW_CONFIRM_MENU_SCREEN = 'game/SHOW_CONFIRM_MENU_SCREEN';
const EXIT_MENU_DENY = 'game/EXIT_MENU_DENY';
const SHOW_CONFIRM_RESTART_SCREEN = 'game/SHOW_CONFIRM_RESTART_SCREEN';
const EXIT_TO_MENU_CONFIRM = 'game/EXIT_TO_MENU_CONFIRM';
const CONFIRM_RESTART = 'game/CONFIRM_RESTART';
const DENY_RESTART = 'game/DENY_RESTART';

const defaultScreenState = {
    paused: false,
    confirmingRestart: false,
    confirmingMenu: false,
};
export function gameScreenReducer( state = defaultScreenState, action = {} ) {

    switch( action.type ) {

        case EXIT_MENU_DENY:
        case DENY_RESTART:
        case PAUSE_GAME:
            return {
                paused: true
            };

        case UNPAUSE_GAME:
            return defaultScreenState;

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

        case EXIT_TO_MENU_CONFIRM:
            return {
                paused: false,
                confirmingRestart: false,
                confirmingMenu: false,
            };

        case CONFIRM_RESTART:
            return {
                paused: false,
                confirmingRestart: false,
                confirmingMenu: false,
            };

        default:
            return state;

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
    // todo probably get these from passing?
    //const {
        //currentChapterId, originalEntities, originalLevels, chapters, books
    //} = this.props;

    //this.props.restartChapter(
        //currentChapterId, originalEntities, originalLevels, chapters, books
    //);
}

export function denyRestart() {
    return { type: DENY_RESTART, };
}

