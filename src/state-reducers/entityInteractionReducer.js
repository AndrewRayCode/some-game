import Cardinality from '../helpers/Cardinality';
import {
    getCardinalityOfVector, getCameraDistanceToPlayer, lerp
} from '../helpers/Utils';
import THREE from 'three';
import { easeInElastic, easeInBounce, easeInOutElastic, easeInBack, easeInExpo } from 'easing-utils';

const scaleDurationMs = 1000;

export default function entityInteractionReducer( actions, props, oldState, currentState, next ) {

    const {
        currentLevelTouchyArray, playerRadius, playerDensity, playerScale,
        currentLevelId, nextChapters, previousChapterFinishEntity,
        previousChapterEntity, previousChapter,
    } = props;

    const { cameraPosition, } = oldState;

    const {
        playerPositionV3, time, cameraFov
    } = currentState;

    const newState = {};

    for( let i = 0; i < currentLevelTouchyArray.length; i++ ) {

        const entity = currentLevelTouchyArray[ i ];
        const distance = entity.position.distanceTo( playerPositionV3 );

        if( entity.type === 'finish' ) {

            // Dumb sphere to cube collision
            if( distance < playerRadius + ( entity.scale.x / 2 ) - playerScale * 0.1 ) {

                newState.isAdvancing = true;

                // this is almost certainly wrong to determine which way
                // the finish line element is facing
                const cardinality = getCardinalityOfVector(
                    Cardinality.RIGHT.clone().applyQuaternion( entity.rotation )
                );
                const isUp = cardinality === Cardinality.DOWN || cardinality === Cardinality.UP;

                if( entity === previousChapterFinishEntity ) {

                    newState.advanceToNextChapter = previousChapter;

                } else {

                    const nextChapter = [ ...nextChapters ].sort( ( a, b ) =>
                        a.position.distanceTo( entity.position ) -
                        b.position.distanceTo( entity.position )
                    )[ 0 ] || previousChapterEntity;

                    newState.advanceToNextChapter = nextChapter;
                
                }

                const isNextChapterBigger = newState.advanceToNextChapter.scale.x > 1;

                // Calculate where to tween the player to. *>2 to move
                // past the hit box for the level exit/entrance
                newState.startTransitionPosition = playerPositionV3;
                newState.currentTransitionPosition = playerPositionV3;
                const currentTransitionTarget = new THREE.Vector3(
                    lerp( playerPositionV3.x, entity.position.x, isUp ? 0 : 2.5 ),
                    playerPositionV3.y,
                    lerp( playerPositionV3.z, entity.position.z, isUp ? 2.5 : 0 ),
                );
                newState.currentTransitionTarget = currentTransitionTarget;
                newState.currentTransitionStartTime = time;
                newState.currentTransitionCameraTarget = new THREE.Vector3(
                    currentTransitionTarget.x,
                    getCameraDistanceToPlayer(
                        playerPositionV3.y, cameraFov, playerScale * ( isNextChapterBigger ? 8 : 0.125 )
                    ),
                    currentTransitionTarget.z,
                );

                newState.transitionCameraPositionStart = cameraPosition;

                return {
                    ...currentState,
                    ...newState
                };

            }

        } else if( entity.scale.x === playerScale &&
                distance < playerRadius * 1.8
            ) {

            const isShrinking = entity.type === 'shrink';
            const radiusDiff = actions.scalePlayer(
                playerRadius, playerPositionV3, playerDensity, entity.id,
                currentLevelId, isShrinking
            );

            newState.isShrinking = isShrinking;
            newState.scaleStartTime = time;
            newState.radiusDiff = radiusDiff;

            break;

        }

    }

    if( newState.scaleStartTime || oldState.scaleStartTime || /* from the debugger */currentState.scaleStartTime  ) {

        const radiusDiff = oldState.radiusDiff || newState.radiusDiff || currentState.radiusDiff;

        // For the first frame, the scalePlayer() won't have completed, so the
        // radius will be stale, and we need to manually adjust it
        const newPlayerRadius = oldState.radiusDiff ?
            playerRadius :
            playerRadius * ( ( newState.isShrinking || currentState.isShrinking ) ? 0.5 : 2 );

        const scaleStartTime = newState.scaleStartTime || oldState.scaleStartTime || currentState.scaleStartTime;
        const currentScalePercent = 1 - ( ( ( time - scaleStartTime ) * 1000 ) / scaleDurationMs );

        const scaleValue = currentScalePercent * radiusDiff;
        newState.scaleValue = scaleValue;
        newState.adjustedPlayerRadius = newPlayerRadius + scaleValue;

        const newScale = newPlayerRadius + radiusDiff * currentScalePercent;

        // A multiplier on the player where 0.5 = base scale
        newState.adjustedPlayerScale = new THREE.Vector3(
            newPlayerRadius + easeInBack( THREE.Math.clamp( ( currentScalePercent - 0.25 ) / 0.75, 0, 1 ) ) * radiusDiff,
            newPlayerRadius + easeInElastic( THREE.Math.clamp( ( currentScalePercent - 0.25 ) / 0.75, 0, 1 ) ) * radiusDiff,
            newPlayerRadius + easeInBounce( Math.min( currentScalePercent / 0.75, 1 ) ) * radiusDiff,
        );

        newState.scalingOffsetZ = newState.adjustedPlayerScale.z - newPlayerRadius;
        
        if( currentScalePercent <= 0 ) {

            newState.isShrinking = null;
            newState.scaleValue = null;
            newState.scalingOffsetZ = null;
            newState.adjustedPlayerScale = null;
            newState.adjustedPlayerRadius = null;
            newState.currentScalePercent = null;
            newState.scaleStartTime = null;
            newState.radiusDiff = null;

        } else {

            newState.currentScalePercent = currentScalePercent;

        }

    }

    return next({
        ...currentState,
        ...newState
    });

}
