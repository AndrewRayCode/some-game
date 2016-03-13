import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import CANNON from 'cannon/src/Cannon';
import KeyCodes from '../../helpers/KeyCodes';
import Cardinality from '../../helpers/Cardinality';
import { Pushy, Player, StaticEntities } from '../../components';
import {
    getEntrancesForTube, without, lerp, getSphereMass, getCubeMass,
    getCameraDistanceToPlayer, getCardinalityOfVector, resetBodyPhysics,
    lookAtVector, findNextTube, snapTo, lerpVectors
} from '../../helpers/Utils';

const factorConstraint = new CANNON.Vec3( 1, 0, 1 );
const angularUprightConstraint = new CANNON.Vec3( 0, 0, 0 );

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

const levelTransitionDuration = 750;

const scaleDurationMs = 300;

const vec3Equals = ( a, b ) => a.clone().sub( b ).length() < 0.0001;

const playerMaterial = new CANNON.Material( 'playerMaterial' );
const pushyMaterial = new CANNON.Material( 'pushyMaterial' );
const wallMaterial = new CANNON.Material( 'wallMaterial' );

// Player to wall
const playerToWallContact = new CANNON.ContactMaterial( playerMaterial, wallMaterial, {
    friction: 0.0,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0.1,
    contactEquationStiffness: 1e12,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRegularizationTime: 3,
    contactEquationRegularizationTime: 3,
});

// Player to pushy
const playerToPushyContact = new CANNON.ContactMaterial( playerMaterial, pushyMaterial, {
    friction: 0,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0,
    contactEquationStiffness: 1e12,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRegularizationTime: 3,
    contactEquationRegularizationTime: 3,
});

// Pushy to wall
const puhshyToWallContact = new CANNON.ContactMaterial( pushyMaterial, wallMaterial, {
    friction: 0.4,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0,
    contactEquationStiffness: 1e12,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRegularizationTime: 3,
    contactEquationRegularizationTime: 3,
});

export default class GameRenderer extends Component {

    static propTypes = {
        fonts: PropTypes.object.isRequired,
        letters: PropTypes.object.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        
        const { playerPosition, playerScale } = props;

        this.state = {
            touring: false,
            cameraPosition: new THREE.Vector3(
                playerPosition.x,
                getCameraDistanceToPlayer( playerPosition.y, cameraFov, playerScale ),
                playerPosition.z
            ),
            lightPosition: new THREE.Vector3(),
            pushyPositions: []
        };

        const world = new CANNON.World();
        this.world = world;

        world.solver.iterations = 20; // Increase solver iterations (default is 10)
        world.solver.tolerance = 0;   // Force solver to use all iterations

        world.addContactMaterial( playerToPushyContact );
        world.addContactMaterial( playerToWallContact );
        world.addContactMaterial( puhshyToWallContact );

        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;

        world.gravity.set( 0, 0, 9.8 );
        world.broadphase = new CANNON.NaiveBroadphase();

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this.updatePhysics = this.updatePhysics.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this._getMeshStates = this._getMeshStates.bind( this );
        this.onPlayerCollide = this.onPlayerCollide.bind( this );
        this.onPlayerContactEndTest = this.onPlayerContactEndTest.bind( this );
        this._setupPhysics = this._setupPhysics.bind( this );

        // Needs proper scoping of this before we can call it :(
        this._setupPhysics( props );

    }

    _setupPhysics( props, playerPositionOverride ) {

        const {
            playerRadius, playerDensity, pushyDensity,
            currentLevelStaticEntitiesArray, currentLevelMovableEntitiesArray
        } = props;

        const playerPosition = playerPositionOverride || props.playerPosition;

        const playerBody = this._createPlayerBody(
            playerPosition, playerRadius, playerDensity
        );

        this.playerContact = {};

        this.world.addBody( playerBody );
        this.playerBody = playerBody;

        this.pushies = currentLevelMovableEntitiesArray.map( entity => {
            const { position, scale } = entity;

            const pushyBody = new CANNON.Body({
                mass: getCubeMass( pushyDensity, scale.x * 0.5 ),
                material: pushyMaterial,
                linearFactor: factorConstraint,
                angularFactor: angularUprightConstraint,
            });
            // Copy scale to pushyBody so _getMeshStates can access it to pass
            // to three
            pushyBody.scale = scale;

            const pushyShape = new CANNON.Box( new CANNON.Vec3(
                0.45 * scale.x,
                0.4 * scale.y,
                0.49 * scale.z,
            ) );

            pushyBody.addShape( pushyShape );
            pushyBody.position.copy( position );
            this.world.addBody( pushyBody );
            return pushyBody;

        });

        currentLevelStaticEntitiesArray.forEach( entity => {

            const { position, scale } = entity;
            const entityBody = new CANNON.Body({
                mass: 0,
                material: wallMaterial
            });
            const boxShape = new CANNON.Box( new CANNON.Vec3(
                scale.x * 0.5,
                scale.y * 0.5,
                scale.z * ( entity.type === 'house' ? 1.5 : 0.5 ),
            ));
            entityBody.addShape( boxShape );
            entityBody.position.set(
                position.x,
                position.y,
                position.z
            );
            entityBody.entity = entity;
            this.world.addBody( entityBody );

        } );

        this.playerBody.addEventListener( 'collide', this.onPlayerCollide );
        this.world.addEventListener( 'endContact', this.onPlayerContactEndTest );

    }

    componentDidMount() {

        window.addEventListener( 'blur', this.onWindowBlur );
        window.addEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.onKeyUp );

    }

    componentWillUnmount() {

        window.removeEventListener( 'blur', this.onWindowBlur );
        window.removeEventListener( 'keydown', this.onKeyDown );
        window.removeEventListener( 'keyup', this.onKeyUp );

        this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );
        this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );

    }

    // Don't forget to pass down any of these props from GameGUI!
    componentWillReceiveProps( nextProps ) {

        if( nextProps.recursionBusterId !== this.props.recursionBusterId ) {

            this.transitionFromLastChapterToNextChapter( nextProps );

        } else if( nextProps.restartBusterId !== this.props.restartBusterId ) {

            this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );
            this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );
            this.world.bodies = [];

            this.world.removeBody( this.playerBody );
            this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );

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

        this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );
        this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );

        this.world.bodies = [];

        const newPosition = new CANNON.Vec3(
            ( currentTransitionPosition.x - chapterPosition.x ) * multiplier,
            1 + nextProps.playerRadius,
            ( currentTransitionPosition.z - chapterPosition.z ) * multiplier,
        );

        this._setupPhysics( nextProps, newPosition );

    }

    onPlayerContactEndTest( event ) {

        const otherBody = event.bodyA === this.playerBody ? event.bodyB : (
            event.bodyB === this.playerBody ? event.bodyA : null
        );

        if( otherBody ) {

            //console.log('ended contact with ',otherBody.id);
            const { playerContact } = this;
            this.playerContact = without( playerContact, otherBody.id );

        }

    }

    onPlayerCollide( event ) {

        const { contact } = event;
        const otherBody = contact.bi === this.playerBody ? contact.bj : contact.bi;
        const contactNormal = getCardinalityOfVector( new THREE.Vector3().copy(
            contact.bi === this.playerBody ?
                contact.ni :
                contact.ni.negate()
        ));

        const { playerContact } = this;

        const assign = {
            [ otherBody.id ]: contactNormal
        };
        //console.log('onPlayerColide with',otherBody.id, contactNormal);
        this.playerContact = { ...playerContact, ...assign };

    }

    updatePhysics( elapsedTime, delta ) {

        if( this.state.touring || this.state.isAdvancing ) {
            return;
        }

        let state = {
            entrances: []
        };

        const {
            playerScale, playerRadius, currentLevelStaticEntitiesArray
        } = this.props;
        const { playerContact } = this;
        const { keysDown } = this;

        const { playerBody } = this;
        const {
            velocity: playerVelocity, position: playerPosition
        } = playerBody;

        let forceX = 0;

        const velocityMoveMax = 5 * playerScale;
        const velocityMax = 10.0 * velocityMoveMax;

        const isLeft = ( KeyCodes.A in keysDown ) || ( KeyCodes.LEFT in keysDown );
        const isRight = ( KeyCodes.D in keysDown ) || ( KeyCodes.RIGHT in keysDown );
        const playerPositionV3 = new THREE.Vector3().copy( playerPosition );
        const playerSnapped = new THREE.Vector3(
            snapTo( playerPositionV3.x, playerScale ),
            snapTo( playerPositionV3.y, playerScale ),
            snapTo( playerPositionV3.z, playerScale )
        ).addScalar( -playerScale / 2 );

        const contactKeys = Object.keys( playerContact );

        if( !this.state.tubeFlow ) {

            for( let i = 0; i < contactKeys.length; i++ ) {
                const key = contactKeys[ i ];

                const physicsBody = this.world.bodies.find( entity => {
                    return entity.id.toString() === key;
                });

                const { entity } = physicsBody;
                if( entity && ( entity.type === 'tube' || entity.type === 'tubebend' ) ) {

                    state.entrances.push( getEntrancesForTube( entity, playerScale ) );

                }

            }

        }

        // Determine which way the player is attempting to move
        if( isLeft ) {
            forceX = -1;
        }
        if( isRight ) {
            forceX = 1;
        }

        let newTubeFlow;
        if( state.entrances.length ) {

            for( let i = 0; i < state.entrances.length; i++ ) {

                const tubeEntrances = state.entrances[ i ];

                const { tube, entrance1, entrance2, threshold1, threshold2, middle } = tubeEntrances;
                const isAtEntrance1 = vec3Equals( playerSnapped, entrance1 );
                const isAtEntrance2 = vec3Equals( playerSnapped, entrance2 );
                const isInTubeRange = isAtEntrance1 || isAtEntrance2;
                const entrancePlayerStartsAt = isAtEntrance1 ? entrance1 : entrance2;
                const thresholdPlayerStartsAt = isAtEntrance1 ? threshold1 : threshold2;
                const thresholdPlayerEndsAt = isAtEntrance1 ? threshold2 : threshold1;

                const playerTowardTube = playerSnapped.clone().add(
                    new THREE.Vector3( forceX, 0, 0 )
                        .normalize()
                        .multiplyScalar( playerScale )
                );

                if( isInTubeRange && vec3Equals( playerTowardTube, tube.position ) ) {

                    playerBody.removeEventListener( 'collide', this.onPlayerCollide );
                    this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );

                    const newPlayerContact = Object.keys( playerContact ).reduce( ( memo, key ) => {

                        const { entity } = this.world.bodies.find( search => {
                            return search.id.toString() === key;
                        });

                        if( entity && ( entity.type !== 'tubebend' && entity.type !== 'tube' ) ) {
                            memo[ key ] = playerContact[ key ];
                        }

                        return memo;

                    }, {} );

                    debuggingReplay = [];

                    newTubeFlow = [{
                        start: playerPositionV3.clone(),
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

                    state = {
                        ...state,
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

                    playerBody.addEventListener( 'collide', this.onPlayerCollide );
                    this.world.addEventListener( 'endContact', this.onPlayerContactEndTest );

                    isDone = true;
                    state = {
                        ...state,
                        tubeFlow: null,
                        currentFlowPosition: null
                    };
                    resetBodyPhysics( playerBody, new CANNON.Vec3(
                        lastTube.exit.x,
                        lastTube.exit.y,
                        lastTube.exit.z
                    ) );
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

                state = {
                    ...state,
                    currentFlowPosition, tubeIndex, startTime, currentPercent,
                    modPercent: ( currentPercent * 2 ) % 1,
                };
                debuggingReplay.push({ ...this.state, ...state, debug: true });

            }

        }

        if( !isFlowing ) {

            if( ( isRight && playerVelocity.x < velocityMax ) ||
                    ( isLeft && playerVelocity.x > -velocityMax ) ) {

                playerVelocity.x = lerp( playerVelocity.x, forceX * velocityMoveMax, 0.1 );

            } else {

                playerVelocity.x = lerp( playerVelocity.x, 0, 0.2 );

            }

            if( KeyCodes.SPACE in keysDown ) {

                const jumpableWalls = Object.keys( playerContact ).reduce( ( memo, key ) => {

                    if( playerContact[ key ] === Cardinality.DOWN ) {
                        memo.down = true;
                    }

                    if( playerContact[ key ] === Cardinality.LEFT ) {
                        memo.left = true;
                    }

                    if( playerContact[ key ] === Cardinality.RIGHT ) {
                        memo.right = true;
                    }

                    return memo;

                }, {});

                if( Object.keys( jumpableWalls ).length ) {

                    if( jumpableWalls.down ) {

                        playerVelocity.z = -Math.sqrt( 1.5 * 4 * 9.8 * playerRadius );

                    }

                }

            }

            this.playerBody.velocity.x = Math.max(
                Math.min( this.playerBody.velocity.x, velocityMax ),
                -velocityMax
            );
            this.playerBody.velocity.z = Math.max(
                Math.min( this.playerBody.velocity.z, velocityMax ),
                -velocityMax
            );

        }

        this.setState( state );

        // Step the physics world
        this.world.step( 1 / 60, delta, 3 );

    }

    _getMeshStates( bodies ) {

        return bodies.map( body => {
            const { position, quaternion, scale } = body;
            return {
                scale: new THREE.Vector3().copy( scale ),
                position: new THREE.Vector3().copy( position ),
                quaternion: new THREE.Quaternion().copy( quaternion )
            };
        });

    }

    _createPlayerBody( position, radius, density ) {

        const playerBody = new CANNON.Body({
            material: playerMaterial,
            mass: getSphereMass( density, radius ),
            angularFactor: angularUprightConstraint,
            linearFactor: factorConstraint,
        });
        playerBody.addEventListener( 'collide', this.onPlayerCollide );

        const playerShape = new CANNON.Sphere( radius );

        playerBody.addShape( playerShape );
        playerBody.position = new CANNON.Vec3().copy( position );

        return playerBody;

    }

    _onAnimate( elapsedTime, delta ) {

        const { keysDown } = this;
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

        const playerPosition = currentFlowPosition || this.playerBody.position;
        const playerPositionV3 = new THREE.Vector3().copy( playerPosition );

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
                newState.cameraTourTarget = playerPositionV3;
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
                transitionPercent
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
                getCameraDistanceToPlayer( this.playerBody.position.y, cameraFov, playerScale ),
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
                    newState.startTransitionPosition = playerPositionV3;
                    newState.currentTransitionPosition = playerPositionV3;
                    const currentTransitionTarget = new THREE.Vector3(
                        lerp( playerPositionV3.x, entity.position.x, isUp ? 0 : 2.5 ),
                        playerPosition.y,
                        lerp( playerPositionV3.z, entity.position.z, isUp ? 2.5 : 0 ),
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
                this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );

                const playerBody = this._createPlayerBody(
                    new CANNON.Vec3(
                        playerPosition.x,
                        1 + newRadius,
                        playerPosition.z + radiusDiff
                    ),
                    newRadius,
                    playerDensity
                );

                this.world.addBody( playerBody );

                this.playerBody = playerBody;

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

        const {
            pushyPositions, time, cameraPosition, currentFlowPosition, debug,
            touring, cameraTourTarget, entrance1, entrance2, tubeFlow,
            tubeIndex, currentScalePercent, radiusDiff,
            currentTransitionPosition, currentTransitionTarget,
        } = ( this.state.debuggingReplay ? this.state.debuggingReplay[ this.state.debuggingIndex ] : this.state );

        const {
            playerRadius, playerScale, nextChapters, nextChaptersEntities,
            previousChapterEntities, previousChapterEntity,
            currentLevelRenderableEntitiesArray, previousChapterFinishEntity,
            assets, shaders, paused
        } = this.props;

        const scaleValue = radiusDiff ? currentScalePercent * radiusDiff : 0;
        const adjustedPlayerRadius = playerRadius + scaleValue;

        const playerPosition = new THREE.Vector3()
            .copy(
                currentTransitionPosition || currentFlowPosition || this.playerBody.position
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
            onUpdate={ this._onAnimate }
        >

            <perspectiveCamera
                name="mainCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                quaternion={ lookAt }
                ref="camera"
            />

            <Player
                ref="player"
                position={ playerPosition }
                radius={ adjustedPlayerRadius }
                quaternion={ new THREE.Quaternion().copy( this.playerBody.quaternion ) }
                materialId="playerMaterial"
            />

            { pushyPositions.map( ( entity, index ) => <Pushy
                key={ index }
                scale={ entity.scale }
                materialId="pushyMaterial"
                position={ entity.position }
                quaternion={ entity.quaternion }
            /> ) }

            <StaticEntities
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
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

        </object3D>;

    }

}
