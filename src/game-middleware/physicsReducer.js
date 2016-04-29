import { Vector3, } from 'three';
import {
    getEntrancesForTube, lerp, findNextTube, snapTo, lerpVectors, p2ToV3,
    vec3Equals, resetBodyPhysics,
} from 'helpers/Utils';
import { canJump } from 'physics-utils';

// TODO: If we need debugging again, fix this
let debuggingReplay = [];

// TODO: Tube travel can probably be its own reducer?
const tubeTravelDurationMs = 200;
const tubeStartTravelDurationMs = 80;

export default function physicsReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        touring, isAdvancing,
        tubeFlow, debug,
    } = oldState;

    const { time, delta, } = currentState;

    if( touring || isAdvancing ) {
        return next( currentState );
    }

    let newState = {
        entrances: [],
    };

    const {
        playerScale, playerRadius, currentLevelStaticEntitiesArray
    } = gameData;

    const { playerContact, playerBody, world } = oldState;
    const {
        velocity: playerVelocity, position: playerPosition2D
    } = playerBody;

    let directionX = 0;
    let directionZ = 0;

    const velocityMoveMax = 5 * playerScale;
    const velocityMax = 10.0 * velocityMoveMax;

    newState.playerBody = playerBody;
    newState.playerVelocity = playerVelocity;

    const isLeft = keysDown.isPressed( 'A' ) || keysDown.isPressed( 'LEFT' );
    const isRight = keysDown.isPressed( 'D' ) || keysDown.isPressed( 'RIGHT' );
    const isUp = keysDown.isPressed( 'W' ) || keysDown.isPressed( 'UP' );
    const isDown = keysDown.isPressed( 'S' ) || keysDown.isPressed( 'DOWN' );

    newState.isLeft = isLeft;
    newState.isRight = isRight;
    newState.isUp = isUp;
    newState.isDown = isDown;

    const playerPosition = p2ToV3( playerPosition2D, 1 + playerRadius );

    const playerSnapped = new Vector3(
        snapTo( playerPosition.x, playerScale ),
        snapTo( playerPosition.y, playerScale ),
        snapTo( playerPosition.z, playerScale )
    ).addScalar( -playerScale / 2 );

    const contactKeys = Object.keys( playerContact );

    if( !tubeFlow ) {

        for( let i = 0; i < contactKeys.length; i++ ) {
            const key = contactKeys[ i ];

            const physicsBody = world.bodies.find( entity => {
                return entity.id.toString() === key;
            });

            const { entity } = physicsBody;
            if( entity && ( entity.type === 'tube' || entity.type === 'tubebend' ) ) {

                newState.entrances.push( getEntrancesForTube( entity, playerScale ) );

            }

        }

    }

    // Determine which way the player is attempting to move
    if( isLeft ) {
        directionX = -1;
    }
    if( isRight ) {
        directionX = 1;
    }
    // Use for tube direction
    if( isUp ) {
        directionZ = -1;
    }
    if( isDown ) {
        directionZ = 1;
    }

    let newTubeFlow;
    if( newState.entrances.length ) {

        for( let i = 0; i < newState.entrances.length; i++ ) {

            const tubeEntrances = newState.entrances[ i ];

            const { tube, entrance1, entrance2, threshold1, threshold2, middle } = tubeEntrances;
            const isAtEntrance1 = vec3Equals( playerSnapped, entrance1 );
            const isAtEntrance2 = vec3Equals( playerSnapped, entrance2 );
            const isInTubeRange = isAtEntrance1 || isAtEntrance2;
            const entrancePlayerStartsAt = isAtEntrance1 ? entrance1 : entrance2;
            const thresholdPlayerStartsAt = isAtEntrance1 ? threshold1 : threshold2;
            const thresholdPlayerEndsAt = isAtEntrance1 ? threshold2 : threshold1;

            const playerTowardTube = playerSnapped.clone().add(
                new Vector3( directionX, 0, directionZ )
                    .normalize()
                    .multiplyScalar( playerScale )
            );
            newState.playerTowardTube = playerTowardTube;

            if( isInTubeRange && vec3Equals( playerTowardTube, tube.position ) ) {

                const newPlayerContact = Object.keys( playerContact ).reduce( ( memo, key ) => {

                    const { entity } = world.bodies.find( search => {
                        return search.id.toString() === key;
                    });

                    if( entity && ( entity.type !== 'tubebend' && entity.type !== 'tube' ) ) {
                        memo[ key ] = playerContact[ key ];
                    }

                    return memo;

                }, {} );

                debuggingReplay = [];

                newTubeFlow = [{
                    start: playerPosition,
                    end: thresholdPlayerStartsAt
                }, {
                    start: thresholdPlayerStartsAt,
                    middle,
                    end: thresholdPlayerEndsAt,
                    exit: isAtEntrance1 ? entrance2 : entrance1
                }];

                let nextTube;
                let currentTube = tube;
                let currentEntrance = entrancePlayerStartsAt;

                let failSafe = 0;
                while( failSafe < 30 && ( nextTube = findNextTube( currentTube, currentEntrance, currentLevelStaticEntitiesArray, playerScale ) ) ) {

                    failSafe++;

                    //console.log('FOUND ANOTHER TUBE');

                    const isAtNextEntrance1 = vec3Equals( nextTube.entrance1, currentTube.position );
                    const isAtNextEntrance2 = vec3Equals( nextTube.entrance2, currentTube.position );

                    if( !isAtNextEntrance1 && !isAtNextEntrance2 ) {
                        console.warn('current entrance',currentEntrance,'did not match either',nextTube.entrance1,'or', nextTube.entrance2);
                        continue;
                    }

                    newTubeFlow.push({
                        start: isAtNextEntrance1 ? nextTube.threshold1 : nextTube.threshold2,
                        middle: nextTube.middle,
                        end: isAtNextEntrance1 ? nextTube.threshold2 : nextTube.threshold1,
                        exit: isAtNextEntrance1 ? nextTube.entrance2 : nextTube.entrance1
                    });

                    currentEntrance = currentTube.position;
                    currentTube = nextTube.tube;

                }

                if( failSafe > 29 ) {
                    newTubeFlow = null;
                }

                //console.log('traversing',newTubeFlow.length - 1,'tubes');

                newState = {
                    ...newState,
                    playerSnapped,
                    playerContact: newPlayerContact,
                    startTime: time,
                    tubeFlow,
                    currentFlowPosition: newTubeFlow[ 0 ].start,
                    tubeIndex: 0
                };

            }

        }

    }

    if( tubeFlow ) {

        let { startTime, tubeIndex } = oldState;

        const isLastTube = tubeIndex === tubeFlow.length - 1;

        let currentPercent = ( time - startTime ) / ( tubeIndex === 0 ?
            tubeStartTravelDurationMs : tubeTravelDurationMs
        ) * ( debug ? 0.1 : 1 );
        let isDone;

        if( currentPercent >= 1 ) {

            //console.log('at end of tube...');

            if( isLastTube ) {
                //console.log('FREE');
                const lastTube = tubeFlow[ tubeIndex ];

                isDone = true;
                newState = {
                    ...newState,
                    tubeFlow: null,
                    currentFlowPosition: null
                };
                resetBodyPhysics( playerBody, [
                    lastTube.exit.x,
                    lastTube.exit.z
                ]);
            } else {
                //console.log('NEXT_TUBE');
                tubeIndex++;
                startTime = time;
                currentPercent = 0;
            }

        }

        const currentTube = tubeFlow[ tubeIndex ];

        if( !isDone ) {

            let currentFlowPosition;

            // For a bent tube, we first tween to the middle position, then
            // tween to the end position. Our percent counter goes from 0
            // to 1, so scale it to go from 0-1, 0-1
            if( currentTube.middle ) {
                const pastMiddle = currentPercent >= 0.5;
                currentFlowPosition = lerpVectors(
                    pastMiddle ? currentTube.middle : currentTube.start,
                    pastMiddle ? ( isLastTube ?
                        currentTube.exit :
                        currentTube.end
                    ) : currentTube.middle,
                    ( currentPercent * 2 ) % 1
                );
            } else {
                currentFlowPosition = lerpVectors(
                    currentTube.start, isLastTube ?
                        currentTube.exit :
                        currentTube.end,
                    currentPercent
                );
            }

            newState = {
                ...newState,
                currentFlowPosition, tubeIndex, startTime, currentPercent,
                modPercent: ( currentPercent * 2 ) % 1,
            };
            debuggingReplay.push({ ...this.state, ...newState, debug: true });

        }

    }

    const isFlowing = tubeFlow || newTubeFlow;

    if( !isFlowing ) {

        if( ( isRight && playerVelocity[ 0 ] < velocityMax ) ||
                ( isLeft && playerVelocity[ 0 ] > -velocityMax ) ) {

            playerVelocity[ 0 ] = lerp( playerVelocity[ 0 ], directionX * velocityMoveMax, 0.1 );

        } else {

            playerVelocity[ 0 ] = lerp( playerVelocity[ 0 ], 0, 0.2 );

        }

        if( keysDown.isPressed( 'SPACE' ) && canJump( world, playerBody ) ) {

            newState.jumpedOnThisFrame = true;
            playerVelocity[ 1 ] = -Math.sqrt( 1.5 * 4 * 9.8 * playerRadius );

        }

        playerVelocity[ 0 ] = Math.max(
            Math.min( playerVelocity[ 0 ], velocityMax ),
            -velocityMax
        );
        playerVelocity[ 1 ] = Math.max(
            Math.min( playerVelocity[ 1 ], velocityMax ),
            -velocityMax
        );

    }

    // Step the physics world
    world.step( 1 / 60, delta, 3 );

    return next({
        ...currentState,
        ...newState,
    });

}
