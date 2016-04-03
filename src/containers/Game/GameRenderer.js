import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import KeyCodes from '../../helpers/KeyCodes';
import p2 from 'p2';
import { Player, EntityGroup } from '../../components';
import {
    getEntrancesForTube, without, lerp, getSphereMass, getCubeMass,
    getCameraDistanceToPlayer, getCardinalityOfVector, resetBodyPhysics,
    lookAtVector, findNextTube, snapTo, lerpVectors, v3toP2, p2ToV3,
    applyMiddleware, deepArrayClone
} from '../../helpers/Utils';
import {
    tourReducer, zoomReducer, entityInteractionReducer, debugReducer,
    advanceLevelReducer, defaultCameraReducer
} from '../../state-reducers';

const radialPoint = ( total, index ) => [
    Math.cos( THREE.Math.degToRad( ( 90 / total ) * index ) ) - 0.5,
    -( Math.sin( THREE.Math.degToRad( ( 90 / total ) * index ) ) - 0.5 )
];

// Generate points along a curve between 0 and 90 degrees along a circle
const radialPoints = total =>
    new Array( total ).fill( 0 ).map( ( zero, index ) =>
        radialPoint( total + 2, index + 1 )
    );

// Counter clockwise. Note that my y axis is swapped relative to p2 :(
const curvedWallVertices = [
    [ -0.5, 0.5 ], // bottom left
    [ 0.5, 0.5 ], // bottom right
    ...radialPoints( 3 ), // Curve
    [ -0.5, -0.5 ] // top left
];

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
            movableEntities: []
        };

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this._updatePhysics = this._updatePhysics.bind( this );
        this.onUpdate = this.onUpdate.bind( this );
        this._getMeshStates = this._getMeshStates.bind( this );
        this._getPlankStates = this._getPlankStates.bind( this );
        this._getAnchorStates = this._getAnchorStates.bind( this );
        this.onWorldEndContact = this.onWorldEndContact.bind( this );
        this.onWorldBeginContact = this.onWorldBeginContact.bind( this );
        this._setupPhysics = this._setupPhysics.bind( this );
        this.scalePlayer = this.scalePlayer.bind( this );

        // Things to pass to reducers so they can call them
        this.reducerActions = {
            scalePlayer: this.scalePlayer,
            advanceChapter: props.advanceChapter
        };

    }

    _setupWorld() {

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
            friction: 0.5,
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

        world.clear();
        world.gravity = [ 0, 9.82 ];

        // p2 is a buncha junk apparently
        //const { bodies } = world;
        //for( let i = bodies.length - 1; i >= 0; i-- ) {
            //world.removeBody( bodies[ i ] );
        //}

    }

    _setupPhysics( props, playerPositionOverride2D ) {

        const {
            playerRadius, playerDensity, pushyDensity,
            currentLevelStaticEntitiesArray, currentLevelMovableEntitiesArray,
            currentLevelBridgesArray
        } = props;

        const playerPosition = playerPositionOverride2D || v3toP2(
            props.playerPosition
        );

        const playerBody = this._createPlayerBody(
            playerPosition,
            playerRadius,
            playerDensity
        );

        const { world } = this;

        world.addBody( playerBody );
        this.playerBody = playerBody;

        this.physicsBodies = currentLevelMovableEntitiesArray.map( entity => {
            const { position, scale } = entity;

            const pushyBody = new p2.Body({
                mass: getCubeMass( pushyDensity, scale.x * 0.8 ),
                position: v3toP2( position ),
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
                width: scale.x,
                height: scale.z,
            });

            pushyBody.addShape( pushyShape );
            world.addBody( pushyBody );
            return pushyBody;

        });

        const emptyWorldAnchor = new p2.Body({
            mass: 0,
            position: [ -100, -100 ]
        });
        world.addBody( emptyWorldAnchor );
        this.emptyWorldAnchor = emptyWorldAnchor;
        
        // Construct the data needed for all bridges (planks and anchors)
        const bridgeData = currentLevelBridgesArray.reduce( ( memo, bridgeEntity ) => {

            const {
                scale, position, segments, paddingPercent, id
            } = bridgeEntity;

            // This is duplicated in the bridge component which isn't ideal,
            // but there are more comments there
            const { x: width, y: size } = scale;
            const plankWidth = size * ( width / segments );
            const plankStartX = -( width / 2 ) + ( plankWidth / 2 );
            const plankBodyWidth = plankWidth - ( paddingPercent * plankWidth );

            // Generate an array to map over for how many planks there are
            const segmentsArray = new Array( segments ).fill( 0 );

            // Build the planks only
            const planks = segmentsArray.map( ( zero, index ) => {

                const plankBody = new p2.Body({
                    mass: getCubeMass( pushyDensity, plankWidth * 1 ),
                    position: [
                        position.x + ( plankWidth * index + plankStartX ),
                        position.z + ( 0.5 * size ),
                    ],
                });

                const plankShape = new p2.Box({
                    material: this.wallMaterial,
                    width: plankBodyWidth,
                    height: 0.1 * size
                });

                plankBody.entityId = id;
                plankBody.depth = position.y;

                plankBody.addShape( plankShape );

                world.addBody( plankBody );
                memo.planks.push( plankBody );

                return plankBody;

            });

            // Bridge plank constants. Hard coded for now, mabye put into the
            // editor later, the problem is that things like distance are
            // computed values. Actually could probably multiply computed
            // value by some "relax" editor value
            const anchorInsetPercent = 0.1;

            // Calculate how long the ropes at rest should be between each
            // plank
            const distance = ( plankWidth * paddingPercent ) +
                ( plankBodyWidth * anchorInsetPercent * 2 );

            const maxForce = 1000000;

            // Build the anchors!
            segmentsArray.map( ( zero, index ) => {

                const plankBody = planks[ index ];
                const nextPlank = planks[ index + 1 ];

                // Is this the first plank? anchor to the left
                if( index === 0 ) {

                    // Figure out the world position of the left anchor...
                    const emptyAnchorBefore = new p2.Body({
                        mass: 0,
                        position: [
                            position.x - ( width * size * 0.5 ) - ( plankBodyWidth * anchorInsetPercent * 2 /* little more cause no padding */ ),
                            position.z - ( 0.4 * size ),
                        ],
                    });

                    // Build a constraint with the proper anchor positions
                    const beforeConstraint = new p2.DistanceConstraint( emptyAnchorBefore, plankBody, {
                        maxForce, distance,
                        localAnchorA: [ 0, 0 ],
                        localAnchorB: [
                            -( plankBodyWidth / 2 ) + ( plankBodyWidth * anchorInsetPercent ),
                            0,
                        ],
                    });

                    // Data needed to group these anchors later at runtime
                    beforeConstraint.entityId = id;
                    beforeConstraint.depth = position.y;
                    memo.constraints.push( beforeConstraint );

                    world.addBody( emptyAnchorBefore );
                    world.addConstraint( beforeConstraint );

                }

                // If there's a next plank, anchor to it
                if( nextPlank ) {

                    const betweenConstraint = new p2.DistanceConstraint( plankBody, nextPlank, {
                        maxForce, distance,
                        localAnchorA: [
                            ( plankBodyWidth / 2 ) - ( plankBodyWidth * anchorInsetPercent ),
                            0,
                        ],
                        localAnchorB: [
                            -( plankBodyWidth / 2 ) + ( plankBodyWidth * anchorInsetPercent ),
                            0,
                        ],
                    });

                    betweenConstraint.entityId = id;
                    betweenConstraint.depth = position.y;
                    memo.constraints.push( betweenConstraint );

                    world.addConstraint( betweenConstraint );

                // Otherwise build the last world anchor
                } else {

                    const emptyAnchorAfter = new p2.Body({
                        mass: 0,
                        position: [
                            position.x + ( width * size * 0.5 ) + ( plankBodyWidth * anchorInsetPercent * 2 ),
                            position.z - ( 0.4 * size ),
                        ],
                    });

                    const afterConstraint = new p2.DistanceConstraint( plankBody, emptyAnchorAfter, {
                        maxForce, distance,
                        localAnchorA: [
                            ( plankWidth / 2 ) - ( plankBodyWidth * anchorInsetPercent ),
                            0,
                        ],
                        localAnchorB: [ 0, 0 ],
                    });

                    afterConstraint.entityId = id;
                    afterConstraint.depth = position.y;
                    memo.constraints.push( afterConstraint );

                    world.addBody( emptyAnchorAfter );
                    world.addConstraint( afterConstraint );

                }

            });

            return memo;

        }, { planks: [], constraints: [] } );

        this.plankData = bridgeData.planks;
        this.plankConstraints = bridgeData.constraints;

        currentLevelStaticEntitiesArray.forEach( entity => {

            const { position, scale, rotation, type } = entity;

            const entityBody = new p2.Body({
                mass: 0,
                position: v3toP2( position ),
            });
            
            let shape;
            if( type === 'curvedwall' ) {

                // Current version of p2 doesn't copy the vertices in and
                // breaks when level restarts, lame. We have to map back to
                // threejs to properly rotate and scale the verts
                const vertices = deepArrayClone( curvedWallVertices )
                    .map( xy =>
                        v3toP2( p2ToV3( xy )
                            .applyQuaternion( rotation )
                            .multiply( scale ) )
                    );
                entityBody.fromPolygon( vertices );

            } else {

                shape = new p2.Box({
                    material: this.wallMaterial,
                    width: scale.x,
                    height: scale.z,
                });
                entityBody.addShape( shape );

            }

            entityBody.entity = entity;
            world.addBody( entityBody );

        });

        this.setState({ playerContact: {} });

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
        const { playerBody } = this;
        const { playerContact } = this.state;

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
            this.setState({
                playerContact: { ...playerContact, ...assign }
            });
            
        }

    }


    onWorldEndContact( event ) {

        let otherBody;
        const { bodyA, bodyB } = event;

        const { playerContact } = this.state;
        const { playerBody, } = this;

        if( bodyA === playerBody ) {

            otherBody = bodyB;

        } else if( bodyB === playerBody ) {

            otherBody = bodyA;

        }

        if( otherBody ) {

            //console.log('ended contact with ',otherBody.id);
            this.setState({
                playerContact: without( playerContact, otherBody.id )
            });

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

    _updatePhysics( elapsedTime, delta ) {

        if( this.state.touring || this.state.isAdvancing ) {
            return;
        }

        let newState = {
            entrances: []
        };

        const {
            playerScale, playerRadius, currentLevelStaticEntitiesArray
        } = this.props;
        const { playerContact } = this.state;
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

        const playerPosition = p2ToV3( playerPosition2D, 1 + playerRadius );

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

                    newState = {
                        ...newState,
                        playerSnapped,
                        playerContact: newPlayerContact,
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

        const { allEntities } = this.props;

        return bodies.map( physicsBody => {
            const { position, scale, entityId } = physicsBody;
            const entity = allEntities[ physicsBody.entityId ];
            return {
                ...entity,
                scale: new THREE.Vector3().copy( scale ),
                position: p2ToV3( position, physicsBody.depth ),
                entityId
            };
        });

    }

    _getPlankStates( plankData ) {

        const { allEntities } = this.props;

        return plankData.reduce( ( memo, plankBody ) => {

            const { position, angle, entityId } = plankBody;
            const entity = allEntities[ plankBody.entityId ];

            const planks = memo[ entityId ] = memo[ entityId ] || [];

            return {
                ...memo,
                [ entityId ]: [
                    ...planks, {
                        position: p2ToV3( position, plankBody.depth )
                            .sub( entity.position ),
                        rotation: new THREE.Euler( 0, -angle, 0 )
                    }
                ]
            };

        }, {} );

    }
    
    _getAnchorStates( plankConstraints ) {

        const { allEntities } = this.props;

        return plankConstraints.reduce( ( memo, constraint ) => {

            const { entityId } = constraint;
            const entity = allEntities[ constraint.entityId ];

            const planks = memo[ entityId ] = memo[ entityId ] || [];

            const worldPositionA = [];
            constraint.bodyA.toWorldFrame( worldPositionA, constraint.localAnchorA );

            const worldPositionB = [];
            constraint.bodyB.toWorldFrame( worldPositionB, constraint.localAnchorB );

            return {
                ...memo,
                [ entityId ]: [
                    ...planks, {
                        positionA: p2ToV3( worldPositionA, constraint.depth )
                            .sub( entity.position ),
                        positionB: p2ToV3( worldPositionB, constraint.depth )
                            .sub( entity.position ),
                    }
                ]
            };

        }, {} );

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

    scalePlayer( playerRadius, playerPosition, playerDensity, entityId, currentLevelId, isShrinking ) {

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
        this.setState({ playerContact: {} });

        this.props.scalePlayer( currentLevelId, entityId, multiplier );

        return radiusDiff;

    }

    onUpdate( elapsedTime, delta ) {

        if( !this.world ) {
            return;
        }

        const { keysDown, playerBody } = this;
        const { playerRadius, paused } = this.props;
        const { currentFlowPosition, } = this.state;

        const playerPosition = currentFlowPosition ||
            p2ToV3( playerBody.position, 1 + playerRadius );

        // In any state, (paused, etc), child components need the updaed time
        const newState = {
            keysDown, cameraFov,
            playerPositionV3: playerPosition,
            time: elapsedTime
        };

        if( paused ) {
            this.setState( newState );
            return;
        }

        // needs to be called before _getMeshStates
        this._updatePhysics( elapsedTime, delta );

        newState.movableEntities = this._getMeshStates( this.physicsBodies );
        newState.plankEntities = this._getPlankStates( this.plankData );
        newState.anchorEntities = this._getAnchorStates( this.plankConstraints );
        newState.lightPosition = new THREE.Vector3(
            10 * Math.sin( elapsedTime * 0.001 * lightRotationSpeed ),
            10,
            10 * Math.cos( elapsedTime * 0.001 * lightRotationSpeed )
        );

        // Apply the middleware
        const reducedState = applyMiddleware(
            this.reducerActions, this.props, this.state, newState,
            tourReducer, advanceLevelReducer, zoomReducer,
            entityInteractionReducer, debugReducer, defaultCameraReducer
        );

        this.setState( reducedState );

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
            movableEntities, time, cameraPosition, cameraPositionZoomOut,
            cameraPositionZoomIn, currentFlowPosition, debug, touring,
            cameraTourTarget, entrance1, entrance2, tubeFlow, tubeIndex,
            currentScalePercent, radiusDiff, currentTransitionPosition,
            currentTransitionTarget, plankEntities, anchorEntities,
            playerContact
        } = ( this.state.debuggingReplay ? this.state.debuggingReplay[ this.state.debuggingIndex ] : this.state );

        const {
            playerRadius, playerScale, nextChapters, nextChaptersEntities,
            previousChapterEntities, previousChapterEntity,
            currentLevelRenderableEntitiesArray, previousChapterFinishEntity,
            assets, shaders, paused,
        } = this.props;

        const { playerBody } = this;
        const scaleValue = radiusDiff ? currentScalePercent * radiusDiff : 0;
        const adjustedPlayerRadius = playerRadius + scaleValue;

        const playerPosition = new THREE.Vector3()
            .copy(
                currentTransitionPosition || currentFlowPosition || p2ToV3(
                    playerBody.position, 1 + playerRadius,
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
                ref="camera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPositionZoomIn || cameraPositionZoomOut || cameraPosition }
                quaternion={ lookAt }
            />

            <Player
                ref="player"
                position={ playerPosition }
                radius={ adjustedPlayerRadius }
                materialId="playerMaterial"
            />

            <EntityGroup
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                ref="staticEntities"
                playerRadius={ playerRadius }
                entities={ movableEntities }
                time={ time }
            />

            <EntityGroup
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                ref="staticEntities"
                playerRadius={ playerRadius }
                entities={ currentLevelRenderableEntitiesArray }
                plankEntities={ plankEntities }
                anchorEntities={ anchorEntities }
                time={ time }
            />

            { nextChapters.map( nextChapter => <EntityGroup
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

            { previousChapterEntity && <EntityGroup
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

            { debug && Object.keys( playerContact || {} ).map( key => {

                return <mesh
                    position={ playerPosition.clone().add( playerContact[ key ].clone().multiplyScalar( playerScale ) ) }
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
                const { contactPointA, bodyA } = contact;
                return <mesh
                    scale={ new THREE.Vector3( playerScale * 0.1, playerScale * 3, playerScale * 0.1 ) }
                    key={ `contact_${ index }_a` }
                    position={ p2ToV3( p2.vec2.add( [ 0, 0 ], contactPointA, bodyA.position ), 1 ) }
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
