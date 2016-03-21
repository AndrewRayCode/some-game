import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import KeyCodes from '../../helpers/KeyCodes';
import Cardinality from '../../helpers/Cardinality';
import p2 from 'p2'; // i hope this doesn't fuck it all up
import { Pushy, Player, StaticEntities } from '../../components';
import {
    getEntrancesForTube, without, lerp, getSphereMass, getCubeMass,
    getCameraDistanceToPlayer, getCardinalityOfVector, resetBodyPhysics,
    lookAtVector, findNextTube, snapTo, lerpVectors
} from '../../helpers/Utils';
import { easeOutQuint, easeOutQuad } from '../../helpers/easing';

let debuggingReplay = [];

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

THREE.TextureLoader.prototype.crossOrigin = '';

const lightRotationSpeed = 0.5;

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;

const tubeTravelDurationMs = 120;
const tubeStartTravelDurationMs = 40;

const zoomOutDurationMs = 750;
const zoomInDurationMs = 500;

const levelTransitionDuration = 500;

const scaleDurationMs = 300;

const vec3Equals = ( a, b ) => a.clone().sub( b ).length() < 0.0001;

const yAxis = p2.vec2.fromValues( 0, -1 );

export default class GameRenderer extends Component {

    static propTypes = {
        fonts: PropTypes.object.isRequired,
        letters: PropTypes.object.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        
        const { playerPosition, playerScale, playerRadius } = props;

        this.state = {
            touring: false,
            cameraPosition: new THREE.Vector3(
                playerPosition.x,
                getCameraDistanceToPlayer( 1 + playerRadius, cameraFov, playerScale ),
                playerPosition.z
            ),
            lightPosition: new THREE.Vector3(),
            pushyPositions: []
        };

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this.updatePhysics = this.updatePhysics.bind( this );
        this.onUpdate = this.onUpdate.bind( this );
        this._getMeshStates = this._getMeshStates.bind( this );
        this.onWorldEndContact = this.onWorldEndContact.bind( this );
        this.onWorldBeginContact = this.onWorldBeginContact.bind( this );
        this._setupPhysics = this._setupPhysics.bind( this );

    }

    _setupWorld( props ) {

        const playerMaterial = new p2.Material();
        const pushyMaterial = new p2.Material();
        const wallMaterial = new p2.Material();

        // Player to wall
        const playerToWallContact = new p2.ContactMaterial( playerMaterial, wallMaterial, {
            friction: 0.0,
            // Bounciness (0-1, higher is bouncier). How much energy is conserved
            // after a collision
            restitution: 0.1,
        });

        // Player to pushy
        const playerToPushyContact = new p2.ContactMaterial( playerMaterial, pushyMaterial, {
            friction: 0,
            // Bounciness (0-1, higher is bouncier). How much energy is conserved
            // after a collision
            restitution: 0,
        });

        // Pushy to wall
        const pushyToWallContact = new p2.ContactMaterial( pushyMaterial, wallMaterial, {
            friction: 1.5,
            // Bounciness (0-1, higher is bouncier). How much energy is conserved
            // after a collision
            restitution: 0,
        });

        const world = new p2.World({
            gravity: [ 0, 9.82 ]
        });

        world.addContactMaterial( playerToPushyContact );
        world.addContactMaterial( playerToWallContact );
        world.addContactMaterial( pushyToWallContact );

        world.on( 'beginContact', this.onWorldBeginContact );
        world.on( 'endContact', this.onWorldEndContact );

        this.world = world;
        this.playerMaterial = playerMaterial;
        this.pushyMaterial = pushyMaterial;
        this.wallMaterial = wallMaterial;

    }

    _teardownWorld() {

        const { world } = this;

        // We could manually removeBody() for all bodies, but that does a lot
        // of work that we don't care about, see
        // http://schteppe.github.io/p2.js/docs/files/src_world_World.js.html#l1005
        world.off( 'beginContact', this.onWorldBeginContact );
        world.off( 'endContact', this.onWorldEndContact );
        world.clear();

        this.world = null;

    }

    _emptyWorld( world ) {

        // p2 is a buncha junk apparently
        const { bodies } = world;
        for( let i = bodies.length - 1; i >= 0; i-- ) {
            world.removeBody( bodies[ i ] );
        }

    }

    _setupPhysics( props, playerPositionOverride2D ) {

        const {
            playerRadius, playerDensity, pushyDensity,
            currentLevelStaticEntitiesArray, currentLevelMovableEntitiesArray
        } = props;

        const playerPosition = playerPositionOverride2D || [
            props.playerPosition.x,
            props.playerPosition.z,
        ];

        const playerBody = this._createPlayerBody(
            playerPosition,
            playerRadius,
            playerDensity
        );

        this.playerContact = {};

        this.world.addBody( playerBody );
        this.playerBody = playerBody;

        this.pushies = currentLevelMovableEntitiesArray.map( entity => {
            const { position, scale } = entity;

            const pushyBody = new p2.Body({
                mass: getCubeMass( pushyDensity, scale.x * 0.5 ),
                position: [ position.x, position.z ],
                fixedRotation: true
            });

            // Copy scale to pushyBody so _getMeshStates can access it to pass
            // to three
            pushyBody.scale = scale;
            pushyBody.entityId = entity.id;

            // Store the y position as "depth" to place this object correctly
            // set back into the screen
            pushyBody.depth = position.y;

            const pushyShape = new p2.Box({
                material: this.pushyMaterial,
                width: 0.99 * scale.x,
                height: 0.99 * scale.z,
            });

            pushyBody.addShape( pushyShape );
            this.world.addBody( pushyBody );
            return pushyBody;

        });

        currentLevelStaticEntitiesArray.forEach( entity => {

            const { position, scale } = entity;
            const entityBody = new p2.Body({
                mass: 0,
                fixedRotation: true,
                position: [
                    position.x,
                    position.z
                ]
            });
            const boxShape = new p2.Box({
                material: this.wallMaterial,
                width: scale.x,
                height: scale.z,
            });

            entityBody.addShape( boxShape );
            entityBody.entity = entity;
            this.world.addBody( entityBody );

        } );

    }

    componentDidMount() {

        window.addEventListener( 'blur', this.onWindowBlur );
        window.addEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.onKeyUp );

        this._setupWorld( this.props );
        this._setupPhysics( this.props );

    }

    componentWillUnmount() {

        window.removeEventListener( 'blur', this.onWindowBlur );
        window.removeEventListener( 'keydown', this.onKeyDown );
        window.removeEventListener( 'keyup', this.onKeyUp );

        this._teardownWorld();

    }

    // Don't forget to pass down any of these props from GameGUI!
    componentWillReceiveProps( nextProps ) {

        if( nextProps.recursionBusterId !== this.props.recursionBusterId ) {

            this.transitionFromLastChapterToNextChapter( nextProps );

        } else if( nextProps.restartBusterId !== this.props.restartBusterId ) {

            this._emptyWorld( this.world );
            this._setupPhysics( nextProps );

            const { playerScale, playerPosition } = nextProps;

            this.setState({
                cameraPosition: new THREE.Vector3(
                    playerPosition.x,
                    getCameraDistanceToPlayer( playerPosition.y, cameraFov, playerScale ),
                    playerPosition.z
                ),
                tubeFlow: null,
                scaleStartTime: null,
                advancing: false,
            });

        }

        //if( this.state.touring ) {
            //this.setState({
                //cameraPosition: new THREE.Vector3(
                    //( cameraPosition.x - chapterPosition.x ) * multiplier,
                    //( cameraPosition.y ) * multiplier,
                    //( cameraPosition.z - chapterPosition.z ) * multiplier
                //),
                //cameraTourTarget: new THREE.Vector3(
                    //( cameraTourTarget.x - chapterPosition.x ) * multiplier,
                    //( cameraTourTarget.y ) * multiplier,
                    //( cameraTourTarget.z - chapterPosition.z ) * multiplier
                //),
            //});
        //}

    }

    transitionFromLastChapterToNextChapter( nextProps ) {

        const {
            cameraPosition, currentTransitionPosition
        } = this.state;

        const { previousChapterNextChapter } = nextProps;
        const {
            position: chapterPosition,
            scale
        } = previousChapterNextChapter;

        const multiplier = scale.x < 1 ? 8 : 0.125;

        this.setState({
            cameraPosition: new THREE.Vector3(
                ( cameraPosition.x - chapterPosition.x ) * multiplier,
                getCameraDistanceToPlayer( 1 + nextProps.playerRadius, cameraFov, nextProps.playerScale ),
                ( cameraPosition.z - chapterPosition.z ) * multiplier
            ),
            currentTransitionPosition: null,
            currentTransitionTarget: null,
            isAdvancing: false,
        });

        this._emptyWorld( this.world );

        const newPosition2D = [
            ( currentTransitionPosition.x - chapterPosition.x ) * multiplier,
            ( currentTransitionPosition.z - chapterPosition.z ) * multiplier,
        ];

        this._setupPhysics( nextProps, newPosition2D );

    }

    onWorldBeginContact( event ) {

        let otherBody;
        const { bodyA, bodyB, contactEquations } = event;
        const { playerBody, playerContact } = this;

        // Figure out if either body equals the player, and if so, assign
        // otherBody to the other body
        if( bodyA === playerBody ) {

            otherBody = bodyB;

        } else if( bodyB === playerBody ) {

            otherBody = bodyA;

        }

        if( otherBody ) {

            // Get the contact point local to body a. There might be an easier
            // way to do this but I can't figure out how
            const { contactPointA } = contactEquations[ 0 ];

            // Convert it to world coordinates
            const contactPointWorld = [
                contactPointA[ 0 ] + bodyA.position[ 0 ],
                contactPointA[ 1 ] + bodyA.position[ 1 ]
            ];

            // Calculate the normal to the player position
            const contactToPlayerNormal = p2.vec2.normalize( [ 0, 0 ], [
                contactPointWorld[ 0 ] - playerBody.position[ 0 ],
                contactPointWorld[ 1 ] - playerBody.position[ 1 ]
            ]);

            const contactNormal = getCardinalityOfVector( new THREE.Vector3(
                contactToPlayerNormal[ 0 ],
                0,
                contactToPlayerNormal[ 1 ],
            ));

            const assign = {
                [ otherBody.id ]: contactNormal
            };
            //console.log('onPlayerColide with',otherBody.id, contactNormal);
            this.playerContact = { ...playerContact, ...assign };
            
        }

    }


    onWorldEndContact( event ) {

        let otherBody;
        const { bodyA, bodyB } = event;

        const { playerBody, playerContact } = this;

        if( bodyA === playerBody ) {

            otherBody = bodyB;

        } else if( bodyB === playerBody ) {

            otherBody = bodyA;

        }

        if( otherBody ) {

            //console.log('ended contact with ',otherBody.id);
            this.playerContact = without( playerContact, otherBody.id );

        }

    }

    _canJump( world, body ) {

        return world.narrowphase.contactEquations.some( contact => {

            if( contact.bodyA === body || contact.bodyB === body ) {

                let d = p2.vec2.dot( contact.normalA, yAxis );
                if( contact.bodyA === body ) {
                    d *= -1;
                }
                return d > 0.5;

            }

        });

    }

    updatePhysics( elapsedTime, delta ) {

        if( this.state.touring || this.state.isAdvancing ) {
            return;
        }

        let newState = {
            entrances: []
        };

        const {
            playerScale, playerRadius, currentLevelStaticEntitiesArray
        } = this.props;
        const { playerContact } = this;
        const { keysDown } = this;

        const { playerBody, world } = this;
        const {
            velocity: playerVelocity, position: playerPosition2D
        } = playerBody;

        let directionX = 0;
        let directionZ = 0;

        const velocityMoveMax = 5 * playerScale;
        const velocityMax = 10.0 * velocityMoveMax;

        const isLeft = ( KeyCodes.A in keysDown ) || ( KeyCodes.LEFT in keysDown );
        const isRight = ( KeyCodes.D in keysDown ) || ( KeyCodes.RIGHT in keysDown );
        const isUp = ( KeyCodes.W in keysDown ) || ( KeyCodes.UP in keysDown );
        const isDown = ( KeyCodes.S in keysDown ) || ( KeyCodes.DOWN in keysDown );

        const playerPosition = new THREE.Vector3(
            playerPosition2D[ 0 ],
            1 + playerRadius,
            playerPosition2D[ 1 ],
        ).clone();

        const playerSnapped = new THREE.Vector3(
            snapTo( playerPosition.x, playerScale ),
            snapTo( playerPosition.y, playerScale ),
            snapTo( playerPosition.z, playerScale )
        ).addScalar( -playerScale / 2 );

        const contactKeys = Object.keys( playerContact );

        if( !this.state.tubeFlow ) {

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
                    new THREE.Vector3( directionX, 0, directionZ )
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

                    this.playerContact = newPlayerContact;

                    newState = {
                        ...newState,
                        playerSnapped,
                        startTime: elapsedTime,
                        tubeFlow: newTubeFlow,
                        currentFlowPosition: newTubeFlow[ 0 ].start,
                        tubeIndex: 0
                    };

                }

            }

        }

        const isFlowing = this.state.tubeFlow || newTubeFlow;

        if( this.state.tubeFlow ) {

            let { startTime, tubeIndex } = this.state;
            const { tubeFlow } = this.state;

            const isLastTube = tubeIndex === tubeFlow.length - 1;

            let currentPercent = ( ( elapsedTime - startTime ) * 1000 ) / ( tubeIndex === 0 ?
                tubeStartTravelDurationMs : tubeTravelDurationMs
            ) * ( this.state.debug ? 0.1 : 1 );
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
                    startTime = elapsedTime;
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

        if( !isFlowing ) {

            if( ( isRight && playerVelocity[ 0 ] < velocityMax ) ||
                    ( isLeft && playerVelocity[ 0 ] > -velocityMax ) ) {

                playerVelocity[ 0 ] = lerp( playerVelocity[ 0 ], directionX * velocityMoveMax, 0.1 );

            } else {

                playerVelocity[ 0 ] = lerp( playerVelocity[ 0 ], 0, 0.2 );

            }

            if( KeyCodes.SPACE in keysDown && this._canJump( world, playerBody ) ) {

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

        this.setState( newState );

        // Step the physics world
        world.step( 1 / 60, delta, 3 );

    }

    _getMeshStates( bodies ) {

        return bodies.map( cannonBody => {
            const { position, quaternion, scale, entityId } = cannonBody;
            return {
                scale: new THREE.Vector3().copy( scale ),
                position: new THREE.Vector3( position[ 0 ], cannonBody.depth, position[ 1 ] ),
                entityId
            };
        });

    }

    _createPlayerBody( position, radius, density ) {

        const playerBody = new p2.Body({
            mass: getSphereMass( density, radius ),
            fixedRotation: true,
            position
        });

        const playerShape = new p2.Circle({
            material: this.playerMaterial,
            radius
        });

        playerBody.addShape( playerShape );

        return playerBody;

    }

    onUpdate( elapsedTime, delta ) {

        const { keysDown, playerBody } = this;
        const {
            currentLevelTouchyArray, playerRadius, playerDensity, playerScale,
            currentLevelId, nextChapters, previousChapterFinishEntity,
            previousChapterEntity, previousChapter, paused
        } = this.props;

        const {
            currentFlowPosition, cameraPosition, isAdvancing
        } = this.state;

        // In any state, (paused, etc), child components need the updaed time
        const newState = {
            time: elapsedTime
        };

        const playerPosition = (
            currentFlowPosition ||
            new THREE.Vector3(
                playerBody.position[ 0 ],
                1 + playerRadius,
                playerBody.position[ 1 ],
            )
        ).clone();

        if( paused ) {
            this.setState( newState );
            return;
        }

        //if( KeyCodes.V in this.keysDown ) {
            //if( !this.dingingv ) {
                //state.debuggingReplay = debuggingReplay;
                //state.debuggingIndex = 0;
                //window.debuggingReplay = debuggingReplay;
                //this.dingingv = true;
            //}
        //} else {
            //this.dingingv = false;
        //}
        //if( KeyCodes.M in this.keysDown ) {
            //if( !this.dingingm && this.state.debuggingIndex < this.state.debuggingReplay.length - 1 ) {
                //state.debuggingIndex = this.state.debuggingIndex + 1;
                //this.dingingm = true;
            //}
        //} else {
            //this.dingingm = false;
        //}
        //if( KeyCodes.L in this.keysDown ) {
            //if( !this.dingingl && this.state.debuggingIndex > 1 ) {
                //state.debuggingIndex = this.state.debuggingIndex - 1;
                //this.dingingl = true;
            //}
        //} else {
            //this.dingingl = false;
        //}

        if( KeyCodes.T in keysDown ) {

            if( !this.touringSwitch ) {
                newState.currentTourPercent = 0;
                newState.touring = !newState.touring;
                newState.cameraTourTarget = playerPosition;
                this.touringSwitch = true;
            }

        } else {

            this.touringSwitch = false;

        }

        if( isAdvancing ) {

            const {
                currentTransitionStartTime, startTransitionPosition,
                currentTransitionTarget, advanceToNextChapter,
                transitionCameraPositionStart, currentTransitionCameraTarget
            } = this.state;

            const transitionPercent = Math.min(
                ( ( elapsedTime - currentTransitionStartTime ) * 1000 ) / levelTransitionDuration,
                1
            );

            newState.currentTransitionPosition = startTransitionPosition
                .clone()
                .lerp( currentTransitionTarget, transitionPercent );

            newState.cameraPosition = lerpVectors(
                transitionCameraPositionStart,
                currentTransitionCameraTarget,
                transitionPercent,
                easeOutQuint
            );

            this.setState( newState, () => {

                if( transitionPercent === 1 ) {

                    this.props.advanceChapter( advanceToNextChapter );

                }

            });

            return;

        }

        if( this.state.touring ) {

            let currentTourPercent = Math.min( this.state.currentTourPercent + 0.01, 1 );

            newState.cameraPosition = this.state.cameraPosition.clone().lerp( new THREE.Vector3(
                0,
                6,
                0,
            ), 0.05 );

            newState.cameraTourTarget = this.state.cameraTourTarget.clone().lerp( new THREE.Vector3(
                0, 0, 0
            ), 0.05 );

            if( currentTourPercent >= 1 && nextChapters.length ) {

                currentTourPercent = 0;
                this.props.advanceChapter(
                    nextChapters[ 0 ].chapterId,
                    nextChapters[ 0 ].scale.x
                );

            }

            newState.currentTourPercent = currentTourPercent;

            this.setState( newState );
            return;

        }

        if( KeyCodes['`'] in keysDown ) {

            if( !this.debugSwitch ) {
                newState.debug = !this.state.debug;
                this.debugSwitch = true;
            }

        } else {

            this.debugSwitch = false;

        }

        // needs to be called before _getMeshStates
        this.updatePhysics( elapsedTime, delta );

        newState.pushyPositions = this._getMeshStates( this.pushies );
        newState.lightPosition = new THREE.Vector3(
            10 * Math.sin( elapsedTime * 0.001 * lightRotationSpeed ),
            10,
            10 * Math.cos( elapsedTime * 0.001 * lightRotationSpeed )
        );

        // Lerp the camera position to the correct follow position. Lerp
        // components individually to make the (y) camera zoom to player
        // different
        newState.cameraPosition = new THREE.Vector3(
            lerp( cameraPosition.x, playerPosition.x, 0.05 / playerScale ),
            lerp(
                cameraPosition.y,
                getCameraDistanceToPlayer( playerPosition.y, cameraFov, playerScale ),
                0.025 / playerScale,
            ),
            lerp( cameraPosition.z, playerPosition.z, 0.05 / playerScale ),
        );

        for( let i = 0; i < currentLevelTouchyArray.length; i++ ) {

            const entity = currentLevelTouchyArray[ i ];
            const distance = entity.position.distanceTo( playerPosition );

            if( entity.type === 'finish' ) {

                // Dumb sphere to cube collision
                if( distance < playerRadius + ( entity.scale.x / 2 ) - playerScale * 0.1 ) {

                    this.playerContact = {};

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
                    newState.startTransitionPosition = playerPosition;
                    newState.currentTransitionPosition = playerPosition;
                    const currentTransitionTarget = new THREE.Vector3(
                        lerp( playerPosition.x, entity.position.x, isUp ? 0 : 2.5 ),
                        playerPosition.y,
                        lerp( playerPosition.z, entity.position.z, isUp ? 2.5 : 0 ),
                    );
                    newState.currentTransitionTarget = currentTransitionTarget;
                    newState.currentTransitionStartTime = elapsedTime;
                    newState.currentTransitionCameraTarget = new THREE.Vector3(
                        currentTransitionTarget.x,
                        getCameraDistanceToPlayer(
                            playerPosition.y, cameraFov, playerScale * ( isNextChapterBigger ? 8 : 0.125 )
                        ),
                        currentTransitionTarget.z,
                    );

                    newState.transitionCameraPositionStart = cameraPosition;

                    this.setState( newState );
                    return;
                }

            } else if( entity.scale.x === playerScale &&
                    entity.position.distanceTo( playerPosition ) < playerRadius * 1.8
                ) {

                const isShrinking = entity.type === 'shrink';
                const multiplier = isShrinking ? 0.5 : 2;
                const newRadius = multiplier * playerRadius;
                const radiusDiff = playerRadius - newRadius;

                this.world.removeBody( this.playerBody );

                const newPlayerBody = this._createPlayerBody(
                    [
                        playerPosition.x,
                        playerPosition.z + radiusDiff
                    ],
                    newRadius,
                    playerDensity,
                );

                this.world.addBody( newPlayerBody );

                this.playerBody = newPlayerBody;

                // Reset contact points
                this.playerContact = {};

                this.props.scalePlayer( currentLevelId, entity.id, multiplier );

                newState.scaleStartTime = elapsedTime;
                newState.radiusDiff = radiusDiff;

                break;

            }

        }

        if( newState.scaleStartTime || this.state.scaleStartTime ) {

            const scaleStartTime = newState.scaleStartTime || this.state.scaleStartTime;
            const currentScalePercent = 1 - ( ( ( elapsedTime - scaleStartTime ) * 1000 ) / scaleDurationMs );

            if( currentScalePercent <= 0 ) {

                newState.scaleStartTime = null;
                newState.radiusDiff = null;

            } else {

                newState.currentScalePercent = currentScalePercent;

            }

        }

        if( KeyCodes.L in keysDown && !this.state.zoomBackInDuration ) {

            newState.zoomOutStartTime = this.state.zoomOutStartTime || elapsedTime;
            newState.zoomBackInDuration = null;
            newState.startZoomBackInTime = null;

            const howFarZoomedOut = Math.min( ( ( elapsedTime - newState.zoomOutStartTime ) * 1000 ) / zoomOutDurationMs, 1 );

            newState.cameraPositionZoomOut = lerpVectors(
                newState.cameraPosition,
                new THREE.Vector3(
                    playerPosition.x / 4,
                    0.5 + getCameraDistanceToPlayer( 1.5, cameraFov, 1 ),
                    playerPosition.z / 4
                ),
                howFarZoomedOut,
                easeOutQuint
            );

        } else if( this.state.cameraPositionZoomOut ) {

            // Then start zooming in to the orignal target
            if( !this.state.zoomBackInDuration ) {

                const howFarZoomedOut = Math.min( ( ( elapsedTime - this.state.zoomOutStartTime ) * 1000 ) / zoomOutDurationMs, 1 );
                newState.zoomBackInDuration = zoomInDurationMs * howFarZoomedOut;
                newState.startZoomBackInTime = elapsedTime;
                newState.zoomOutStartTime = null;

            }

            const zoomBackInDuration = newState.zoomBackInDuration || this.state.zoomBackInDuration;
            const startZoomBackInTime = newState.startZoomBackInTime || this.state.startZoomBackInTime;

            const howFarZoomedIn = Math.min(
                ( ( elapsedTime - startZoomBackInTime ) * 1000 ) / zoomBackInDuration,
                1
            );

            newState.cameraPositionZoomOut = lerpVectors(
                new THREE.Vector3(
                    playerPosition.x / 4,
                    0.5 + getCameraDistanceToPlayer( 1.5, cameraFov, 1 ),
                    playerPosition.z / 4
                ),
                newState.cameraPosition,
                howFarZoomedIn,
                easeOutQuad
            );

            if( howFarZoomedIn === 1 ) {

                newState.zoomBackInDuration = null;
                newState.startZoomBackInTime = null;
                newState.zoomOutStartTime = null;
                newState.cameraPositionZoomOut = null;

            }

        }

        this.setState( newState );

    }

    onWindowBlur() {

        this.keysDown = {};

    }

    onKeyDown( event ) {

        const which = { [ event.which ]: true };
        this.keysDown = Object.assign( {}, this.keysDown, which );

    }

    onKeyUp( event ) {

        this.keysDown = without( this.keysDown, event.which );

    }

    render() {

        if( !this.world ) {

            return <object3D />;

        }

        const {
            pushyPositions, time, cameraPosition, cameraPositionZoomOut,
            currentFlowPosition, debug, touring, cameraTourTarget, entrance1,
            entrance2, tubeFlow, tubeIndex, currentScalePercent, radiusDiff,
            currentTransitionPosition, currentTransitionTarget,
        } = ( this.state.debuggingReplay ? this.state.debuggingReplay[ this.state.debuggingIndex ] : this.state );

        const {
            playerRadius, playerScale, nextChapters, nextChaptersEntities,
            previousChapterEntities, previousChapterEntity,
            currentLevelRenderableEntitiesArray, previousChapterFinishEntity,
            assets, shaders, paused, allEntities
        } = this.props;

        const { playerBody } = this;
        const scaleValue = radiusDiff ? currentScalePercent * radiusDiff : 0;
        const adjustedPlayerRadius = playerRadius + scaleValue;

        const playerPosition = new THREE.Vector3()
            .copy(
                currentTransitionPosition || currentFlowPosition || new THREE.Vector3(
                    playerBody.position[ 0 ],
                    1 + playerRadius,
                    playerBody.position[ 1 ],
                )
            ).sub(
                new THREE.Vector3(
                    0, 0, radiusDiff ? currentScalePercent * radiusDiff : 0
                )
            );

        const lookAt = lookAtVector(
            cameraPosition,
            touring ? cameraTourTarget : playerPosition
        );

        return <object3D
            onUpdate={ this.onUpdate }
        >

            <perspectiveCamera
                name="mainCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPositionZoomOut || cameraPosition }
                quaternion={ lookAt }
                ref="camera"
            />

            <Player
                ref="player"
                position={ playerPosition }
                radius={ adjustedPlayerRadius }
                materialId="playerMaterial"
            />

            { pushyPositions.map( ( cannonBody, index ) => <Pushy
                key={ index }
                scale={ cannonBody.scale }
                materialId={ allEntities[ cannonBody.entityId ].materialId }
                position={ cannonBody.position }
            /> ) }

            <StaticEntities
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                ref="staticEntities"
                playerRadius={ playerRadius }
                entities={ currentLevelRenderableEntitiesArray }
                time={ time }
            />

            { nextChapters.map( nextChapter => <StaticEntities
                paused={ paused }
                key={ nextChapter.id }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                position={ nextChapter.position }
                scale={ nextChapter.scale }
                playerRadius={ playerRadius }
                entities={ nextChaptersEntities[ nextChapter.chapterId ] }
                time={ time }
            /> )}

            { previousChapterEntity && <StaticEntities
                paused={ paused }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                position={ previousChapterEntity.position }
                scale={ previousChapterEntity.scale }
                entities={ previousChapterEntities }
                playerRadius={ playerRadius }
                time={ time }
                opacity={ 0.5 }
            /> }

            { debug && previousChapterFinishEntity && <mesh
                position={ previousChapterFinishEntity.position }
                scale={ previousChapterFinishEntity.scale.clone().multiply( new THREE.Vector3( 1, 2, 1 ) ) }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="middleMaterial"
                />
            </mesh> }

            { debug && currentTransitionTarget && <mesh
                position={ currentTransitionTarget }
                scale={ new THREE.Vector3( 0.2, 2, 0.2 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }

            { debug && tubeFlow && tubeFlow[ tubeIndex ].middle && <mesh
                position={ tubeFlow[ tubeIndex ].middle }
                scale={ new THREE.Vector3( 0.25, 2, 0.25 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="middleMaterial"
                />
            </mesh> }
            { debug && tubeFlow && <mesh
                position={ ( tubeIndex === tubeFlow.length - 1 ?
                    tubeFlow[ tubeIndex ].exit :
                    tubeFlow[ tubeIndex ].end
                ) }
                scale={ new THREE.Vector3( 0.15, 2, 0.15 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && tubeFlow && <mesh
                position={ tubeFlow[ tubeIndex ].start }
                scale={ new THREE.Vector3( 0.15, 2, 0.15 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="entranceMaterial"
                />
            </mesh> }

            { debug && entrance1 && <mesh
                position={ entrance1 }
                scale={ new THREE.Vector3( 0.5, 2, 0.5 ).multiplyScalar( playerScale )}
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="playerMaterial"
                />
            </mesh> }
            { debug && entrance2 && <mesh
                position={ entrance2 }
                scale={ new THREE.Vector3( 0.5, 2, 0.5 ).multiplyScalar( playerScale )}
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && this.state.playerSnapped && <mesh
                position={this.state.playerSnapped }
                scale={ new THREE.Vector3( 0.1, 3.5, 0.1 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && this.state.playerTowardTube && <mesh
                position={this.state.playerTowardTube }
                scale={ new THREE.Vector3( 0.1, 3.5, 0.1 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="greenDebugMaterial"
                />
            </mesh> }

            { debug && Object.keys( this.playerContact || {} ).map( key => {

                return <mesh
                    position={ playerPosition.clone().add( this.playerContact[ key ].clone().multiplyScalar( playerScale ) ) }
                    scale={ new THREE.Vector3( 0.1, 3, 0.15 ).multiplyScalar( playerScale ) }
                    key={ key }
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="playerMaterial"
                    />
                </mesh>;

            }) }

            { debug && this.world.narrowphase.contactEquations.map( ( contact, index ) => {
                const { contactPointA, contactPointB, bodyA, bodyB } = contact;
                return <mesh
                    scale={ new THREE.Vector3( playerScale * 0.1, playerScale * 3, playerScale * 0.1 ) }
                    key={ `contact_${ index }_a` }
                    position={
                        new THREE.Vector3(
                            contactPointA[ 0 ] + bodyA.position[ 0 ],
                            1,
                            contactPointA[ 1 ] + bodyA.position[ 1 ]
                        )
                    }
                >
                    <geometryResource
                        resourceId="radius1sphere"
                    />
                    <materialResource
                        resourceId="greenDebugMaterial"
                    />
                </mesh>;
            }) }

        </object3D>;

    }

}
