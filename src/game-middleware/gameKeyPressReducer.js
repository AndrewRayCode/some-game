import { P, ESC, R, M, B, } from 'helpers/KeyCodes';

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

    if( keysDown.isFirstPress( P ) || keysDown.isFirstPress( ESC ) ) {

        action = () => actions.pauseGame();

    } else if( keysDown.isFirstPress( R ) ) {

        action = () => actions.showConfirmRestartScreen();

    } else if( keysDown.isFirstPress( M ) ) {

        action = () => actions.showConfirmMenuScreen();

    } else if( keysDown.isFirstPress( B ) ) {

        action = () => actions.showConfirmRestartBookMenuScreen();

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
