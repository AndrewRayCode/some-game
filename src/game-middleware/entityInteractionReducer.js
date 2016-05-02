import Cardinality from '../helpers/Cardinality';
import { scalePlayer, } from 'physics-utils';
import {
    getCardinalityOfVector, getCameraDistanceToPlayer, lerp,
    playerV3ToFinishEntityV3Collision, playerToCircleCollision3dTo2d,
} from 'helpers/Utils';
import THREE from 'three';

// Warning: duplicated in playerScaleReducer
const scaleStartDelayMs = 250;

export default function entityInteractionReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        currentLevelTouchyArray, playerRadius, playerDensity, playerScale,
        currentLevelId, nextChapters, previousChapterFinishEntity,
        previousChapterEntity, previousChapter, cameraFov,
    } = gameData;

    const { cameraPosition, world, playerBody, } = oldState;

    const { playerPositionV3, time, } = currentState;

    let newState = {};

    for( let i = 0; i < currentLevelTouchyArray.length; i++ ) {

        const entity = currentLevelTouchyArray[ i ];

        if( entity.scale.x !== playerScale ) {
            continue;
        }

        if( entity.type === 'finish' ) {

            // Dumb sphere to cube collision
            if( playerV3ToFinishEntityV3Collision(
                playerPositionV3,
                playerRadius,
                entity.position,
                entity.scale,
            ) ) {

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

        } else if( !oldState.scaleStartTime &&
            playerToCircleCollision3dTo2d(
                playerPositionV3,
                playerRadius,
                entity.position,
                entity.scale.x * 0.5,
            )
        ) {

            const isShrinking = entity.type === 'shrink';

            // Perform the physics scale
            const scaleResult = scalePlayer(
                world, playerBody, playerRadius, playerPositionV3,
                playerDensity, isShrinking
            );

            // Perform the store update
            actions.scalePlayer( currentLevelId, entity.id, scaleResult.multiplier, );

            newState = {
                ...newState,
                playerContact: {},
                isShrinking,
                radiusDiff: scaleResult.radiusDiff,
                playerBody: scaleResult.playerBody,
                scaleStartTime: time + scaleStartDelayMs,
            };

            break;

        }

    }

    return next({
        ...currentState,
        ...newState
    });

}
