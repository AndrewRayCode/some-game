import KeyCodes from '../helpers/KeyCodes';

const scaleDurationMs = 300;

export default function debugReducer( actions, props, oldState, currentState, next ) {

    const {
        sizeSwitch, debugSwitch, debug
    } = oldState;

    const { scalePlayer } = actions;

    const { playerRadius, playerDensity, currentLevelId, } = props;

    const { keysDown, playerPositionV3 } = currentState;

    const newState = {};

    if( KeyCodes['`'] in keysDown ) {

        if( !debugSwitch ) {
            newState.debug = !debug;
            newState.debugSwitch = true;
        }

    } else {

        newState.debugSwitch = false;

    }

    if( ( KeyCodes['-'] in keysDown ) || ( KeyCodes['='] in keysDown ) ) {

        if( !sizeSwitch ) {

            actions.scalePlayer(
                playerRadius, playerPositionV3, playerDensity, null,
                currentLevelId, ( KeyCodes['-'] in keysDown )
            );

            newState.sizeSwitch = true;
        }

    } else {

        newState.sizeSwitch = false;

    }

    return next({
        ...currentState,
        ...newState
    });

}
