import { scalePlayer, } from 'physics-utils';
import { SHIFT, MINUS, EQUALS, BACKTICK, } from 'helpers/KeyCodes';

export default function debugReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        debug, world, playerBody, sideEffectQueue, playerPositionV3,
    } = oldState;

    const { playerRadius, playerDensity, currentLevelId, } = gameData;

    const { time, delta, } = currentState;

    const newState = {};

    if( keysDown.isFirstPress( BACKTICK ) ) {

        newState.debug = !debug;

    }

    if( !newState.debug && !oldState.debug ) {

        return next( currentState );

    }

    const minusPressed = keysDown.isFirstPress( MINUS );
    if( minusPressed || keysDown.isFirstPress( EQUALS ) ) {

        const scaleResult = scalePlayer(
            world, playerBody, playerRadius, playerPositionV3, playerDensity,
            minusPressed
        );

        return ({
            ...currentState,
            ...newState,
            playerContact: {},
            isShrinking: minusPressed,
            sideEffectQueue: [
                ...sideEffectQueue,
                () => actions.scalePlayer( currentLevelId, null, scaleResult.multiplier, ),
            ],
            radiusDiff: scaleResult.radiusDiff,
            playerBody: scaleResult.playerBody,
            scaleStartTime: time + 250,
        });

    }

    if( keysDown.isPressed( SHIFT ) ) {

        newState.startSlow = oldState.startSlow || time;

        newState.time = newState.startSlow + ( time - newState.startSlow ) * 0.25;
        newState.delta = delta * 0.25;

    } else {

        newState.startSlow = null;

    }

    return next({
        ...currentState,
        ...newState
    });

}
