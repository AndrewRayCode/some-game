export default function gameScreenReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        paused, confirmingMenu, confirmingRestart,
    } = gameData;

    if( paused || confirmingMenu || confirmingRestart ) {

        return currentState;

    }

    return next( currentState );

}
