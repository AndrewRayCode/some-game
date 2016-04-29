export default function gameKeyPressReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    if( keysDown.isFirstPress( 'P' ) || keysDown.isFirstPress( 'ESC' ) ) {

        actions.onPause();
        return currentState;

    } else if( keysDown.isFirstPress( 'R' ) ) {

        actions.onShowConfirmRestartScreen();
        return currentState;

    } else if( keysDown.isFirstPress( 'M' ) ) {

        actions.onShowConfirmMenuScreen();
        return currentState;

    }

    return next( currentState );

}
