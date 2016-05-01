export default function gameKeyPressReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    if( keysDown.isFirstPress( 'P' ) || keysDown.isFirstPress( 'ESC' ) ) {

        actions.pauseGame();
        return currentState;

    } else if( keysDown.isFirstPress( 'R' ) ) {

        actions.showConfirmRestartScreen();
        return currentState;

    } else if( keysDown.isFirstPress( 'M' ) ) {

        actions.showConfirmMenuScreen();
        return currentState;

    }

    return next( currentState );

}
