import KeyCodes from '../helpers/KeyCodes';
import THREE from 'three';

export default function debugReducer( actions, props, oldState, currentState, next ) {

    const { debug } = oldState;

    const { scalePlayer } = actions;

    const { playerRadius, playerDensity, currentLevelId, } = props;

    const { keysDown, playerPositionV3, time, } = currentState;

    const newState = {};

    if( keysDown.isFirstPress( '`' ) ) {

        newState.debug = !debug;

    }

    const minusPressed = keysDown.isFirstPress( '-' );
    if( minusPressed || keysDown.isFirstPress( '=' ) ) {

        const radiusDiff = actions.scalePlayer(
            playerRadius, playerPositionV3, playerDensity, null,
            currentLevelId, minusPressed
        );

        newState.isShrinking = minusPressed;
        newState.radiusDiff = radiusDiff;
        newState.scaleStartTime = time;

    }

    return next({
        ...currentState,
        ...newState
    });

}
