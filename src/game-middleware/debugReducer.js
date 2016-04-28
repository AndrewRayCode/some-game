
export default function debugReducer(
    keysDown:Object,
    actions:Object,
    props:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { debug } = oldState;

    const { playerRadius, playerDensity, currentLevelId, } = props;

    const { playerPositionV3, time, } = currentState;

    const newState = {};

    if( keysDown.isFirstPress( '`' ) ) {

        newState.debug = !debug;

    }

    const minusPressed = keysDown.isFirstPress( '-' );
    if( minusPressed || keysDown.isFirstPress( '=' ) ) {

        const radiusDiff = actions.scalePlayerAndDispatch(
            oldState, playerRadius, playerPositionV3, playerDensity, null,
            currentLevelId, minusPressed
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
