export default function gameKeyPressReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { sideEffectQueue, } = oldState;
    let action;

    if( keysDown.isFirstPress( 'P' ) || keysDown.isFirstPress( 'ESC' ) ) {

        action = () => actions.pauseGame();

    } else if( keysDown.isFirstPress( 'R' ) ) {

        action = () => actions.showConfirmRestartScreen();

    } else if( keysDown.isFirstPress( 'M' ) ) {

        action = () => actions.showConfirmMenuScreen();

    }

    if( action ) {

        return {
            ...currentState,
            sideEffectQueue: [
                ...sideEffectQueue,
                action
            ],
        };

    }

    return next( currentState );

}
