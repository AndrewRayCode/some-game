
export default function debugReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { debug } = oldState;

    const { playerRadius, playerDensity, currentLevelId, } = gameData;

    const { playerPositionV3, time, } = currentState;

    const { reduxScalePlayer, } = actions;

    const newState = {};

    if( keysDown.isFirstPress( '`' ) ) {

        newState.debug = !debug;

    }

    const minusPressed = keysDown.isFirstPress( '-' );
    if( minusPressed || keysDown.isFirstPress( '=' ) ) {

        const radiusDiff = actions.scalePlayerAndDispatch(
            oldState, reduxScalePlayer, playerRadius, playerPositionV3,
            playerDensity, null, currentLevelId, minusPressed
        );

        newState.isShrinking = minusPressed;
        newState.radiusDiff = radiusDiff;
        newState.scaleStartTime = time + 0.25; // seconds :(

    }

    return next({
        ...currentState,
        ...newState
    });

}
