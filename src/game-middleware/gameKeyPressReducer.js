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

        actions.showConfirmMenuScreen();
        return currentState;

    } else if( keysDown.isFirstPress( 'M' ) ) {

        actions.showConfirmRestartScreen();
        return currentState;

    }

    return next( currentState );

}
