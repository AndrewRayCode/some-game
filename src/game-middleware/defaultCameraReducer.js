import { Vector3, } from 'three';
import { lerp, getCameraDistanceToPlayer } from '../helpers/Utils';

const initialCameraPosition = new Vector3( 0, 0, 0 );

export default function defaultCameraReducer(
    keysDown:Object,
    actions:Object,
    props:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { cameraPosition, } = oldState;
    const { playerScale, } = props;
    const { playerPositionV3, cameraFov } = currentState;

    if( currentState.cameraPosition ) {

        return currentState;

    }

    // Lerp the camera position to the correct follow position. Lerp components
    // individually to make the (y) camera zoom to player different
    return next({
        ...currentState,
        cameraPosition: cameraPosition ?
            new Vector3(
                lerp( cameraPosition.x, playerPositionV3.x, 0.05 / playerScale ),
                lerp(
                    cameraPosition.y,
                    getCameraDistanceToPlayer( playerPositionV3.y, cameraFov, playerScale ),
                    0.025 / playerScale,
                ),
                lerp( cameraPosition.z, playerPositionV3.z, 0.05 / playerScale )
            ) :
            initialCameraPosition,
    });

}
