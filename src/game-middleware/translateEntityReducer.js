import * as Cardinality from 'helpers/Cardinality';
import * as easing from 'easing-utils';
import { scalePlayer, canJump } from 'physics-utils';
import { lerpVectors, v3toP2, } from 'helpers/Utils';
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
        cameraPosition, world, playerBody, textQueue, physicsBodiesByEntityId,
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

        const percent = Math.min( ( time - startTime ) / duration, 1 );

        const entity = allEntities[ entityId ];

        entity.position = lerpVectors(
            startPosition,
            target,
            percent,
            easing[ easingType ]
        );

        physicsBodiesByEntityId[ entityId ].position = v3toP2( entity.position );
        
        if( percent < 1 ) {

            newState.moveQueue.push( data );

        }

    });

    return next({
        ...currentState,
        ...newState
    });

}
