import KeyCodes from '../helpers/KeyCodes';
import THREE from 'three';

export default function gameKeyPressReducer( actions, props, oldState, currentState, next ) {

    const { paused } = props;
    const { keysDown } = currentState;

    if( keysDown.isFirstPress( 'P' ) ) {

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
