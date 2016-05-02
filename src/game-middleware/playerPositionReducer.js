import { p2ToV3, getPlayerYFromRadius, } from 'helpers/Utils';

export default function playerPositionReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        playerBody, currentFlowPosition,
    } = oldState;

    const { physicsInitted, playerRadius, } = gameData;

    // Short circuit the flow if the phyics haven't been initted yet
    if( !physicsInitted ) {
        return currentState;
    }

    const playerPositionV3 = currentFlowPosition ||
        p2ToV3( playerBody.position, getPlayerYFromRadius( playerRadius ) );

    return next({
        ...currentState,
        playerPositionV3,
    });

}
