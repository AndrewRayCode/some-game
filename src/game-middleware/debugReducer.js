import { scalePlayer, } from 'physics-utils';

export default function debugReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { debug, world, playerBody, sideEffectQueue, } = oldState;

    const { playerRadius, playerDensity, currentLevelId, } = gameData;

    const { playerPositionV3, time, } = currentState;

    let newState = {};

    if( keysDown.isFirstPress( '`' ) ) {

        newState.debug = !debug;

    }

    const minusPressed = keysDown.isFirstPress( '-' );
    if( minusPressed || keysDown.isFirstPress( '=' ) ) {

        const scaleResult = scalePlayer(
            world, playerBody, playerRadius, playerPositionV3, playerDensity,
            minusPressed
        );

        newState = {
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
        };

    }

    return next({
        ...currentState,
        ...newState
    });

}
