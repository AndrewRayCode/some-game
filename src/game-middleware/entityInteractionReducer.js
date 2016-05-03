import Cardinality from '../helpers/Cardinality';
import { scalePlayer, canJump } from 'physics-utils';
import {
    getCardinalityOfVector, getCameraDistanceToPlayer, lerp,
    playerV3ToFinishEntityV3Collision, playerToCircleCollision3dTo2d,
    playerToBoxCollision3dTo2d,
} from 'helpers/Utils';
import { Vector3, } from 'three';

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
        currentGameChapterId, currentChapterId, allChaptersArray,
    } = gameData;

    const {
        cameraPosition, world, playerBody, textQueue, sideEffectQueue,
    } = oldState;

    const { playerPositionV3, time, } = currentState;

    let newState = {};

    for( let i = 0; i < currentLevelTouchyArray.length; i++ ) {

        const entity = currentLevelTouchyArray[ i ];

        if( entity.scale.x !== playerScale ) {
            continue;
        }

        if( entity.type === 'finish' ) {

            // This would make a good abstracted out function, probably
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

                let isNextChapterBigger;

                // Go to parent chapter of this one
                if( entity === previousChapterFinishEntity ) {

                    const previousChapterNextChapterData = previousChapter.nextChapters.find(
                        data => data.chapterId === currentChapterId
                    );
                    
                    isNextChapterBigger = previousChapterNextChapterData.scale.x < 1;
                    const multiplier = isNextChapterBigger ? 8 : 0.125;

                    // Data needed to correclty re-position the player
                    const nextChapter = {
                        position: previousChapterNextChapterData.position
                            .clone()
                            .multiplyScalar( -multiplier ),
                        scale: new Vector3( multiplier, multiplier, multiplier, ),
                    };

                    // Find who, if anyone, linked to the previous chapter
                    const previousPreviousChapter = allChaptersArray.find( chapter =>
                        chapter.nextChapters.find( data => data.chapterId === previousChapter.id )
                    );

                    newState.advanceAction = () =>
                        actions.advanceToPreviousChapter(
                            nextChapter, previousChapter.id, previousPreviousChapter ? previousPreviousChapter.id : null, isNextChapterBigger,
                        );

                // Go to child chapter of this one
                } else {

                    const nextChapter = [ ...nextChapters ].sort( ( a, b ) =>
                        a.position.distanceTo( entity.position ) -
                        b.position.distanceTo( entity.position )
                    )[ 0 ];

                    // If we're going forward then the nextChapter data will
                    // have the scale of the next level
                    isNextChapterBigger = nextChapter.scale.x > 1;

                    newState.advanceAction = () =>
                        actions.advanceChapter( nextChapter );
                
                }

                // Calculate where to tween the player to. *>2 to move
                // past the hit box for the level exit/entrance
                newState.startTransitionPosition = playerPositionV3;
                newState.currentTransitionPosition = playerPositionV3;
                const currentTransitionTarget = new Vector3(
                    lerp( playerPositionV3.x, entity.position.x, isUp ? 0 : 2.5 ),
                    playerPositionV3.y,
                    lerp( playerPositionV3.z, entity.position.z, isUp ? 2.5 : 0 ),
                );
                newState.currentTransitionTarget = currentTransitionTarget;
                newState.currentTransitionStartTime = time;
                newState.currentTransitionCameraTarget = new Vector3(
                    currentTransitionTarget.x,
                    getCameraDistanceToPlayer(
                        // todo: when going from small to big (like going
                        // backwards), the camera needs to zoom *out*, but we
                        // don't support scales bigger than 1, set to 1 for now
                        playerPositionV3.y, cameraFov, playerScale * ( isNextChapterBigger ? 1 : 0.125 )
                    ),
                    currentTransitionTarget.z,
                );

                newState.transitionCameraPositionStart = cameraPosition;

                return {
                    ...currentState,
                    ...newState
                };

            }

        } else if(
            ( entity.type === 'grow' || entity.type === 'shrink' ) &&
            !oldState.scaleStartTime &&
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
            newState = {
                ...newState,
                sideEffectQueue: [
                    ...sideEffectQueue,
                    () => actions.scalePlayer( currentLevelId, entity.id, scaleResult.multiplier, ),
                ],
                playerContact: {},
                isShrinking,
                radiusDiff: scaleResult.radiusDiff,
                playerBody: scaleResult.playerBody,
                scaleStartTime: time + scaleStartDelayMs,
            };

            break;

        } else if(
            entity.type === 'textTrigger' &&
            canJump( world, playerBody ) &&
            playerToBoxCollision3dTo2d(
                playerPositionV3,
                playerRadius,
                entity.position,
                entity.scale,
            )
        ) {

            newState.textQueue = [
                ...textQueue,
                ...entity.texts,
            ];
            newState.sideEffectQueue = [
                ...sideEffectQueue,
                () => actions.removeEntity( currentLevelId, entity.id, ),
            ];

        }

    }

    return next({
        ...currentState,
        ...newState
    });

}
