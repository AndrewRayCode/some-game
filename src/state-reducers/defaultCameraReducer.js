import THREE from 'three';
import { lerp, getCameraDistanceToPlayer } from '../helpers/Utils';

export default function defaultCameraReducer( actions, props, oldState, currentState, next ) {

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
        cameraPosition: new THREE.Vector3(
            lerp( cameraPosition.x, playerPositionV3.x, 0.05 / playerScale ),
            lerp(
                cameraPosition.y,
                getCameraDistanceToPlayer( playerPositionV3.y, cameraFov, playerScale ),
                0.025 / playerScale,
            ),
            lerp( cameraPosition.z, playerPositionV3.z, 0.05 / playerScale ),
        )
    });

}
