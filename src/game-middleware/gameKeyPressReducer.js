import KeyCodes from '../helpers/KeyCodes';

export default function gameKeyPressReducer( actions, props, oldState, currentState, next ) {

    const { keysDown } = currentState;

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
