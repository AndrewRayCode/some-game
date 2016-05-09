import * as Cardinality from 'helpers/Cardinality';
import * as easing from 'easing-utils';
import { scalePlayer, canJump } from 'physics-utils';
import {
    getCardinalityOfVector, getCameraDistanceToPlayer, lerp,
    playerV3ToFinishEntityV3Collision, playerToCircleCollision3dTo2d,
    playerToBoxCollision3dTo2d, lerpVectors,
} from 'helpers/Utils';
import { Vector3, } from 'three';

export default function translateEntityReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { allEntities, } = gameData;

    const {
        cameraPosition, world, playerBody, textQueue, sideEffectQueue,
    } = oldState;

    const moveQueue = currentState.moveQueue || oldState.moveQueue;

    if( !moveQueue.length ) {

        return next( currentState );

    }

    const { time, } = currentState;

    const newState = {
        moveQueue: [],
    };

    moveQueue.forEach( data => {

        const {
            easing: easingType,
            entityId, target, startTime, duration, startPosition,
        } = data;

        const percent = Math.max( ( time - startTime ) / duration );

        const entity = allEntities[ entityId ];

        entity.position = lerpVectors(
            startPosition,
            target,
            percent,
            easing[ easingType ]
        );
        
        if( percent < 1 ) {

            newState.moveQueue.push( data );

        }

    });

    return next({
        ...currentState,
        ...newState
    });

}
