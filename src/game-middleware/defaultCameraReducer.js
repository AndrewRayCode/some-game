import { Vector3, } from 'three';
import { lerp, getCameraDistanceToPlayer } from '../helpers/Utils';

export default function defaultCameraReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { cameraPosition, } = oldState;
    const { playerScale, cameraFov, } = gameData;
    const { playerPositionV3, } = currentState;

    // If someone else already set the camera, don't try to handle it
    if( currentState.cameraPosition ) {

        return next( currentState );

    }

    const cameraTarget = new Vector3(
        playerPositionV3.x,
        getCameraDistanceToPlayer( playerPositionV3.y, cameraFov, playerScale ),
        playerPositionV3.z,
    );

    // Lerp the camera position to the correct follow position. Lerp components
    // individually to make the (y) camera zoom to player different
    return next({
        ...currentState,
        cameraPosition: cameraPosition ?
            new Vector3(
                lerp( cameraPosition.x, cameraTarget.x, 0.05 / playerScale ),
                lerp( cameraPosition.y, cameraTarget.y, 0.025 / playerScale ),
                lerp( cameraPosition.z, cameraTarget.z, 0.05 / playerScale ),
            ) :
            cameraTarget,
    });

}
