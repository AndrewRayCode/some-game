import KeyCodes from '../helpers/KeyCodes';
import THREE from 'three';

export default function tourReducer( actions, props, oldState, currentState, next ) {

    const {
        touringSwitch, touring, cameraPosition,
        currentTourPercent: oldTourPercent
    } = oldState;

    const { advanceChapter } = actions;

    const { nextChapters } = props;

    const { keysDown, playerPositionV3, } = currentState;

    const newState = {};

    if( KeyCodes.T in keysDown ) {

        if( !touringSwitch ) {
            newState.currentTourPercent = 0;
            newState.touring = !newState.touring;
            newState.cameraTourTarget = playerPositionV3;
            newState.touringSwitch = true;
        }

    } else {

        newState.touringSwitch = false;

    }

    if( touring ) {

        let currentTourPercent = Math.min( oldTourPercent + 0.01, 1 );

        newState.cameraPosition = cameraPosition.clone().lerp( new THREE.Vector3(
            0,
            6,
            0,
        ), 0.05 );

        newState.cameraTourTarget = this.state.cameraTourTarget.clone().lerp( new THREE.Vector3(
            0, 0, 0
        ), 0.05 );

        if( currentTourPercent >= 1 && nextChapters.length ) {

            currentTourPercent = 0;
            advanceChapter(
                nextChapters[ 0 ].chapterId,
                nextChapters[ 0 ].scale.x
            );

        }

        newState.currentTourPercent = currentTourPercent;

        return newState;

    }

    return next({
        ...currentState,
        ...newState
    });

}
