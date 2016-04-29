import THREE from 'three';
import { getCameraDistanceToPlayer, lerpVectors, } from '../helpers/Utils';
import { easeOutQuint, easeOutQuad } from 'easing-utils';

const zoomInDurationMs = 750;
const zoomOutDurationMs = 500;

function zoomedInPosition( playerPosition, cameraFov, playerScale ) {

    return new THREE.Vector3(
        playerPosition.x,
        0.5 + getCameraDistanceToPlayer( 1.5, cameraFov, playerScale / 8 ),
        playerPosition.z - 0.5,
    );

}

export default function zoomInReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
) {

    const {
        zoomBackOutDuration, zoomInStartTime, cameraPositionZoomIn,
        startZoomBackOutTime, cameraPosition,
    } = oldState;

    const {
        time, playerPositionV3, cameraFov,
    } = currentState;

    const { playerScale, } = gameData;

    const newState = {};

    // Should we zoom in?
    if( keysDown.isPressed( 'K' ) && !zoomBackOutDuration ) {

        newState.zoomInStartTime = zoomInStartTime || time;

        const howFarZoomedIn = Math.min(
            ( ( time - newState.zoomInStartTime ) * 1000 ) / zoomInDurationMs,
            1
        );

        newState.cameraPositionZoomIn = lerpVectors(
            cameraPosition,
            zoomedInPosition( playerPositionV3, cameraFov, playerScale ),
            howFarZoomedIn,
            easeOutQuint
        );

    // Otherwise, if we are zoomed on, zoom back out
    } else if( cameraPositionZoomIn ) {

        if( !zoomBackOutDuration ) {

            const howFarZoomedIn = Math.min(
                ( ( time - zoomInStartTime ) * 1000 ) / zoomOutDurationMs,
                1
            );
            newState.zoomBackOutDuration = zoomInDurationMs * howFarZoomedIn;
            newState.startZoomBackOutTime = time;
            newState.zoomInStartTime = null;

        }

        const _zoomBackOutDuration = newState.zoomBackOutDuration || zoomBackOutDuration;
        const _startZoomBackOutTime = newState.startZoomBackOutTime || startZoomBackOutTime;

        const howFarZoomedIn = Math.min(
            ( ( time - _startZoomBackOutTime ) * 1000 ) / _zoomBackOutDuration,
            1
        );

        newState.cameraPositionZoomIn = lerpVectors(
            zoomedInPosition( playerPositionV3, cameraFov, playerScale ),
            cameraPosition,
            howFarZoomedIn,
            easeOutQuad
        );

        if( howFarZoomedIn === 1 ) {

            newState.zoomBackOutDuration = null;
            newState.startZoomBackOutTime = null;
            newState.zoomInStartTime = null;
            newState.cameraPositionZoomIn = null;

        }

    }

    if( Object.keys( newState ).length ) {

        // Short circut
        return {
            ...currentState,
            ...newState
        };

    } else {

        // Do nothing
        return currentState;

    }

}
