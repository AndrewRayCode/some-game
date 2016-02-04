import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import CANNON from 'cannon/src/Cannon';
import StaticEntities from '../Dung/StaticEntities';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { scalePlayer, advanceLevel } from '../../redux/modules/game';
import KeyCodes from '../Dung/KeyCodes';
import Cardinality from '../Dung/Cardinality';
import Pushy from '../Dung/Pushy';
import Player from '../Dung/Player';
import {
    getEntrancesForTube, without, lerp
} from '../Dung/Utils';

const factorConstraint = new CANNON.Vec3( 1, 0, 1 );
const angularUprightConstraint = new CANNON.Vec3( 0, 0, 0 );

let debuggingReplay = [];

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

THREE.TextureLoader.prototype.crossOrigin = '';

const lightRotationSpeed = 0.5;
const clock = new THREE.Clock();

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;

const shadowD = 20;
const boxes = 5;

const tubeTravelDurationMs = 200;
const tubeStartTravelDurationMs = 50;

const levelTransitionDuration = 1000;

const scaleDurationMs = 300;

const wallJumpVerticalDampen = 0.4;

const coolDownTimeMs = 500;

const raycaster = new THREE.Raycaster();

const vec3Equals = ( a, b ) => a.clone().sub( b ).length() < 0.0001;

function lerpVectors( vectorA, vectorB, alpha ) {
    return new THREE.Vector3().lerpVectors( vectorA, vectorB, alpha );
}

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

function getSphereMass( density, radius ) {

    return density * ( 4 / 3 ) * Math.PI * Math.pow( radius, 3 );

}

function getCubeMass( density, side ) {

    return density * Math.pow( side, 3 );

}

function getCameraDistanceToPlayer( playerY, aspect, fov, objectSize ) {

    return playerY + Math.max(
        5 * Math.abs( objectSize / Math.sin( ( fov * ( Math.PI / 180 ) ) / 2 ) ),
        1.5
    );

}

function getCardinalityOfVector( v3 ) {

    // Not rotated
    if( v3.length() === 0 ) {
        return Cardinality.NULL;
    }

    const { field, value } = [
        { field: 'x', value: v3.x },
        { field: 'y', value: v3.y },
        { field: 'z', value: v3.z }
    ].sort( ( a, b ) => {
        return Math.abs( a.value ) - Math.abs( b.value );
    })[ 2 ];

    if( field === 'x' ) {
        return value < 0 ? Cardinality.LEFT : Cardinality.RIGHT;
    } else if( field === 'y' ) {
        return value < 0 ? Cardinality.BACK : Cardinality.FORWARD;
    } else {
        return value < 0 ? Cardinality.UP : Cardinality.DOWN;
    }

}

function snapVectorAngleTo( v3, snapAngle ) {

    const angle = v3.angleTo( Cardinality.UP );

    if( angle < snapAngle / 2.0 ) {
        return Cardinality.UP.clone().multiplyScalar( v3.length() );
    } else if( angle > 180.0 - snapAngle / 2.0 ) {
        return Cardinality.DOWN.clone().multiplyScalar( v3.length() );
    }

    const t = Math.round( angle / snapAngle );
    const deltaAngle = ( t * snapAngle ) - angle;

    const axis = new THREE.Vector3().crossVectors( Cardinality.UP, v3 );
    const q = new THREE.Quaternion().setFromAxisAngle( axis, deltaAngle );

    return v3.clone().applyQuaternion( q );

}

function resetBodyPhysics( body, position ) {

    // Position
    body.position.copy( position );
    body.previousPosition.copy( position );
    body.interpolatedPosition.copy( position );
    body.initPosition.copy( position );

    // orientation
    body.quaternion.set( 0, 0, 0, 1 );
    body.initQuaternion.set( 0, 0, 0, 1 );
    body.previousQuaternion.set( 0, 0, 0, 1 );
    body.interpolatedQuaternion.set( 0, 0, 0, 1 );

    // Velocity
    body.velocity.setZero();
    body.initVelocity.setZero();
    body.angularVelocity.setZero();
    body.initAngularVelocity.setZero();

    // Force
    body.force.setZero();
    body.torque.setZero();

    // Sleep state reset
    body.sleepState = 0;
    body.timeLastSleepy = 0;
    body._wakeUpAfterNarrowphase = false;
}

function lookAtVector( sourcePoint, destPoint ) {

    return new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt( sourcePoint, destPoint, Cardinality.UP )
    );

}

function findNextTube( tube, entrance, entities, scale ) {

    const { entrance1, entrance2 } = getEntrancesForTube( tube, scale );

    const isEntrance1 = vec3Equals( entrance, entrance1 );
    const isEntrance2 = vec3Equals( entrance, entrance2 );

    if( !isEntrance1 && !isEntrance2 ) {
        console.warn( 'Entrance',entrance,'did not match',entrance1,'or',entrance2 );
        return null;
    }

    const exit = isEntrance1 ? entrance2 : entrance1;

    const nextTube = entities.find( ( entity ) => {
        return vec3Equals( entity.position, exit );
    });

    if( nextTube ) {

        return getEntrancesForTube( nextTube, scale );

    }

}

function snapTo( number, interval ) {

    return interval * Math.ceil( number / interval );

}

@connect(
    ( state ) => {

        const { levels } = state.game;
        const currentLevelId = state.currentGameLevel;
        const currentLevel = levels[ currentLevelId ];
        const allEntities = state.game.entities;

        const {
            currentLevelAllEntities,
            currentLevelStaticEntities,
            currentLevelRenderableEntities,
            currentLevelMovableEntities,
            currentLevelTouchyEntities,
        } = currentLevel.entityIds.reduce( ( memo, id ) => {

            const entity = allEntities[ id ];
            memo.currentLevelAllEntities[ id ] = entity;

            if( entity.type === 'shrink' || entity.type === 'grow' || entity.type === 'finish' ) {
                memo.currentLevelTouchyEntities[ id ] = entity;
                // needs to go into static to render
                memo.currentLevelRenderableEntities[ id ] = entity;
            } else if( entity.type === 'pushy' ) {
                memo.currentLevelMovableEntities[ id ] = entity;
            // walls, floors, etc
            } else if( entity.type !== 'level' ) {
                memo.currentLevelStaticEntities[ id ] = entity;
                memo.currentLevelRenderableEntities[ id ] = entity;
            }

            return memo;

        }, {
            currentLevelRenderableEntities: {},
            currentLevelMovableEntities: {},
            currentLevelAllEntities: {},
            currentLevelStaticEntities: {},
            currentLevelTouchyEntities: {},
        });

        // Determine next level data
        const nextLevels = currentLevel.nextLevelIds.map( data => ({
            level: levels[ data.levelId ],
            entity: allEntities[ data.entityId ],
            entities: levels[ data.levelId ].entityIds
                .map( id => allEntities[ id ] )
                .filter( entity => entity.type !== 'level' )
        }));

        // Build all the next level entities. It's all next level entities
        // combined together
        const nextLevelsEntitiesArray = nextLevels.reduce( ( memo, data ) => {
            return memo.concat( data.level.entities );
        }, [] );

        // Determine previous level data
        const previousLevelId = Object.keys( levels ).find(
            levelId => levels[ levelId ].nextLevelIds.some(
                data => data.levelId === currentLevelId
            )
        );
        const previousLevelData = previousLevelId && levels[ previousLevelId ];

        const previousLevelEntityData = previousLevelData && allEntities[
            previousLevelData.nextLevelIds.find(
                data => data.levelId === currentLevelId
            ).entityId
        ];

        const isPreviousLevelBigger = previousLevelData &&
            previousLevelEntityData.scale.x > 1;
        const multiplier = isPreviousLevelBigger ? 0.125 : 8;
        const previousLevel = previousLevelData && {
            level: previousLevelData,
            entity: {
                ...previousLevelEntityData,
                scale: new THREE.Vector3( multiplier, multiplier, multiplier ),
                position: previousLevelEntityData.position
                    .clone()
                    .multiply(
                        new THREE.Vector3( -multiplier, multiplier, -multiplier )
                    )
                    .setY( isPreviousLevelBigger ? 0.875 : -7 )
            }
        };

        const previousLevelEntitiesArray = previousLevelData && previousLevelData.entityIds
            .map( id => allEntities[ id ] )
            .filter( entity => entity.type !== 'level' );

        const previousLevelFinishData = previousLevelData && previousLevelData.entityIds
            .map( id => allEntities[ id ] )
            .find( entity => entity.type === 'finish' );

        const previousLevelFinishEntity = previousLevelFinishData && {
            ...previousLevelFinishData,
            scale: previousLevelFinishData.scale
                .clone()
                .multiplyScalar( multiplier ),
            position: previousLevel.entity.position.clone().add(
                previousLevelFinishData.position
                    .clone()
                    .multiplyScalar( multiplier )
            )
        };

        if( previousLevelFinishEntity ) {
            currentLevelTouchyEntities[ previousLevelFinishData.id ] = previousLevelFinishEntity;
        }

        return {
            levels, currentLevel, currentLevelId, currentLevelAllEntities,
            currentLevelStaticEntities, allEntities, nextLevels,
            nextLevelsEntitiesArray,
            currentLevelStaticEntitiesArray: Object.values( currentLevelStaticEntities ),
            currentLevelTouchyArray: Object.values( currentLevelTouchyEntities ),
            previousLevel, previousLevelEntitiesArray, previousLevelId,
            currentLevelMovableEntities,
            currentLevelMovableEntitiesArray: Object.values( currentLevelMovableEntities ),
            currentLevelRenderableEntities,
            currentLevelRenderableEntitiesArray: Object.values( currentLevelRenderableEntities ),
            previousLevelFinishEntity,

            playerPosition: state.game.playerPosition,
            playerRadius: state.game.playerRadius,
            playerScale: state.game.playerScale,
            playerDensity: state.game.playerDensity,
            pushyDensity: state.game.pushyDensity,
            playerMass: getSphereMass(
                state.game.playerDensity, state.game.playerRadius
            )
        };

    },
    dispatch => bindActionCreators( { scalePlayer, advanceLevel }, dispatch )
)
export default class Game extends Component {

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        this.playerContact = {};

        this.state = {
            touring: false,
            cameraPosition: new THREE.Vector3(
                0,
                // starting position and scale
                getCameraDistanceToPlayer( 1.5, cameraAspect, cameraFov, 1 ),
                0
            ),
            lightPosition: new THREE.Vector3(),
            pushyPositions: []
        };

        this.wallCoolDowns = {};

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
            currentLevel, allEntities, playerRadius, playerDensity, playerMass,
            currentLevelStaticEntitiesArray, pushyDensity,
            currentLevelMovableEntitiesArray
        } = props;

        const playerPosition = playerPositionOverride || props.playerPosition;

        const playerBody = this._createPlayerBody(
            playerPosition, playerRadius, playerDensity
        );

        this.world.addBody( playerBody );
        this.playerBody = playerBody;

        this.pushies = currentLevelMovableEntitiesArray.map( ( entity ) => {
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
            pushyBody.position.copy( entity.position );
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
                scale.x / 2,
                scale.y / 2,
                scale.z / 2
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

    componentWillReceiveProps( nextProps ) {

        if( nextProps.currentLevel.id !== this.props.currentLevel.id ) {

            const {
                nextLevels, previousLevelId, previousLevel
            } = this.props;
            const { cameraPosition, cameraTourTarget } = this.state;

            const maybeNextLevel = nextLevels.find(
                data => data.level.id === nextProps.currentLevel.id
            );
            const newLevel = maybeNextLevel ? maybeNextLevel.entity : previousLevel.entity;

            const multiplier = newLevel.scale.x < 1 ? 8 : 0.125;

            if( this.state.touring ) {
                this.setState({
                    cameraPosition: new THREE.Vector3(
                        ( cameraPosition.x - newLevel.position.x ) * multiplier,
                        ( cameraPosition.y ) * multiplier,
                        ( cameraPosition.z - newLevel.position.z ) * multiplier
                    ),
                    cameraTourTarget: new THREE.Vector3(
                        ( cameraTourTarget.x - newLevel.position.x ) * multiplier,
                        ( cameraTourTarget.y ) * multiplier,
                        ( cameraTourTarget.z - newLevel.position.z ) * multiplier
                    ),
                });
            } else {
                this.setState({
                    cameraPosition: new THREE.Vector3(
                        ( cameraPosition.x - newLevel.position.x ) * multiplier,
                        getCameraDistanceToPlayer( this.playerBody.position.y, cameraAspect, cameraFov, nextProps.playerScale ),
                        ( cameraPosition.z - newLevel.position.z ) * multiplier
                    )
                });
            }

        }

    }

    componentWillUpdate( nextProps, nextState ) {

        if( nextProps.currentLevel.id !== this.props.currentLevel.id ) {

            this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );
            this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );

            this.world.bodies = [];

            const {
                nextLevels, previousLevelId, previousLevel
            } = this.props;
            const { position } = this.playerBody;
            let newPosition;

            const maybeNextLevel = nextLevels.find(
                data => data.level.id === nextProps.currentLevel.id
            );
            const newLevel = maybeNextLevel ? maybeNextLevel.entity : previousLevel.entity;

            const multiplier = newLevel.scale.x < 1 ? 8 : 0.125;

            newPosition = new CANNON.Vec3(
                ( position.x - newLevel.position.x ) * multiplier,
                1 + nextProps.playerRadius,
                ( position.z - newLevel.position.z ) * multiplier,
            );

            this._setupPhysics( nextProps, newPosition );

        }

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

    updatePhysics() {

        if( this.state.touring || this.advancing ) {
            return;
        }

        const now = Date.now();

        let state = {
            entrances: []
        };

        const {
            playerScale, currentLevel, playerRadius, playerMass,
            currentLevelStaticEntitiesArray, previousLevelId
        } = this.props;
        const { playerContact } = this;
        const { keysDown } = this;
        let forceX = 0;
        let forceZ = 0;

        const velocityMax = 5.0 * playerScale;
        const moveForce = 200 / Math.pow( 1 / playerScale, 3 );
        const airMoveForce = 50 / Math.pow( 1 / playerScale, 3 );
        const jumpForce = -Math.sqrt( 2.0 * 4 * 9.8 * playerRadius );

        const isLeft = ( KeyCodes.A in keysDown ) || ( KeyCodes.LEFT in keysDown );
        const isRight = ( KeyCodes.D in keysDown ) || ( KeyCodes.RIGHT in keysDown );
        const isUp = ( KeyCodes.W in keysDown ) || ( KeyCodes.UP in keysDown );
        const isDown = ( KeyCodes.S in keysDown ) || ( KeyCodes.DOWN in keysDown );
        const playerPosition = new THREE.Vector3().copy( this.playerBody.position );
        const playerSnapped = new THREE.Vector3(
            snapTo( playerPosition.x, playerScale ),
            snapTo( playerPosition.y, playerScale ),
            snapTo( playerPosition.z, playerScale )
        ).addScalar( -playerScale / 2 );

        const contactKeys = Object.keys( playerContact );

        if( !this.state.tubeFlow ) {

            for( let i = 0; i < contactKeys.length; i++ ) {
                const key = contactKeys[ i ];

                const physicsBody = this.world.bodies.find( ( entity ) => {
                    return entity.id.toString() === key;
                });

                const { entity } = physicsBody;
                if( entity && ( entity.type === 'tube' || entity.type === 'tubebend' ) ) {

                    state.entrances.push( getEntrancesForTube( entity, playerScale ) );

                }

            }

        }

        if( isLeft ) {
            const percentAwayFromTarget = Math.min( ( Math.abs( -velocityMax - this.playerBody.velocity.x ) / velocityMax ) * 4, 1 );
            forceX -= moveForce * percentAwayFromTarget;
        }
        if( isRight ) {
            const percentAwayFromTarget = Math.min( ( Math.abs( velocityMax - this.playerBody.velocity.x ) / velocityMax ) * 4, 1 );
            forceX += moveForce * percentAwayFromTarget;
        }
        if( isUp ) {
            forceZ -= airMoveForce;
        }
        if( isDown ) {
            forceZ += airMoveForce;
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
                    new THREE.Vector3( forceX, 0, forceZ )
                        .normalize()
                        .multiplyScalar( playerScale )
                );

                if( isInTubeRange && vec3Equals( playerTowardTube, tube.position ) ) {

                    this.playerBody.removeEventListener( 'collide', this.onPlayerCollide );
                    this.world.removeEventListener( 'endContact', this.onPlayerContactEndTest );

                    const newPlayerContact = Object.keys( playerContact ).reduce( ( memo, key ) => {

                        const { entity } = this.world.bodies.find( ( search ) => {
                            return search.id.toString() === key;
                        });


                        if( entity && ( entity.type !== 'tubebend' && entity.type !== 'tube' ) ) {
                            memo[ key ] = playerContact[ key ];
                        }

                        return memo;

                    }, {} );

                    debuggingReplay = [];

                    newTubeFlow = [{
                        start: playerPosition.clone(),
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
                        startTime: now,
                        tubeFlow: newTubeFlow,
                        currentFlowPosition: newTubeFlow[ 0 ].start,
                        tubeIndex: 0
                    };

                }

            }

        }

        const isFlowing = this.state.tubeFlow || newTubeFlow;

        if( this.state.tubeFlow ) {

            const time = now;
            let { startTime, tubeIndex } = this.state;
            const { tubeFlow } = this.state;

            const isLastTube = tubeIndex === tubeFlow.length - 1;

            let currentPercent = ( time - startTime ) / ( tubeIndex === 0 ?
                tubeStartTravelDurationMs : tubeTravelDurationMs
            ) * ( this.state.debug ? 0.1 : 1 );
            let isDone;

            if( currentPercent >= 1 ) {

                //console.log('at end of tube...');

                if( isLastTube ) {
                    //console.log('FREE');
                    const lastTube = tubeFlow[ tubeIndex ];

                    this.playerBody.addEventListener( 'collide', this.onPlayerCollide );
                    this.world.addEventListener( 'endContact', this.onPlayerContactEndTest );

                    isDone = true;
                    state = {
                        ...state,
                        tubeFlow: null,
                        currentFlowPosition: null
                    };
                    resetBodyPhysics( this.playerBody, new CANNON.Vec3(
                        lastTube.exit.x,
                        lastTube.exit.y,
                        lastTube.exit.z
                    ) );
                } else {
                    //console.log('NEXT_TUBE');
                    tubeIndex++;
                    startTime = now;
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

            if( forceX ) {
                this.playerBody.applyImpulse(
                    new CANNON.Vec3( forceX, 0, 0 ),
                    new CANNON.Vec3( 0, 0, 0 )
                );
            } else {
                this.playerBody.velocity.x = lerp( this.playerBody.velocity.x, 0, 0.2 );
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

                        this.playerBody.velocity.z = -Math.sqrt( 1.5 * 4 * 9.8 * playerRadius );

                    }

                    const coolDowns = {};
                    for( const key in playerContact ) {
                        coolDowns[ key ] = now;
                    }
                    this.wallCoolDowns = Object.assign( {}, this.wallCoolDowns, coolDowns );


                }

            }

            this.playerBody.velocity.x = Math.max(
                Math.min( this.playerBody.velocity.x, velocityMax ),
                -velocityMax
            );

        }

        this.setState( state );

        // Step the physics world
        const delta = clock.getDelta();
        if( delta ) {
            this.world.step( 1 / 60, delta, 3 );
        }

    }

    _getMeshStates( bodies ) {

        return bodies.map( ( body ) => {
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

    _onAnimate() {

        const now = Date.now();

        const {
            currentLevelTouchyArray, playerRadius, playerDensity, playerScale,
            currentLevel, nextLevels, previousLevelFinishEntity,
            previousLevel, previousLevelId
        } = this.props;

        const {
            playerBoyd, currentFlowPosition, _fps, cameraPosition
        } = this.state;

        const playerPosition = currentFlowPosition || this.playerBody.position;

        // needs to be called before _getMeshStates
        this.updatePhysics();

        const newState = {
            time: now,
            pushyPositions: this._getMeshStates( this.pushies ),
            lightPosition: new THREE.Vector3(
                10 * Math.sin( clock.getElapsedTime() * lightRotationSpeed ),
                10,
                10 * Math.cos( clock.getElapsedTime() * lightRotationSpeed )
            )
        };

        if( !this.lastCalledTime ) {
           this.lastCalledTime = now;
           this.counter = 0;
           newState._fps = 0;
        } else {
            const smoothing = 0.9;
            const delta = ( now - this.lastCalledTime ) / 1000;
            this.lastCalledTime = now;

            newState._fps = Math.round(
                ( ( 1 / delta ) * smoothing ) + ( _fps * ( 1.0 - smoothing ) )
            );

            if( !( this.counter++ % 15 ) ) {
                newState.fps = newState._fps;
            }
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

        if( KeyCodes.T in this.keysDown ) {

            if( !this.touringSwitch ) {
                newState.currentTourPercent = 0;
                newState.touring = !newState.touring;
                newState.cameraTourTarget = new THREE.Vector3().copy( playerPosition );
                this.touringSwitch = true;
            }

        } else {

            this.touringSwitch = false;

        }

        if( KeyCodes.ESC in this.keysDown ) {

            this.props.onGameEnd();

        }

        if( this.advancing ) {

            const currentPosition = new THREE.Vector3().copy( this.playerBody.position );
            const transitionPercent = Math.min(
                ( now - this.state.currentTransitionStartTime ) / levelTransitionDuration,
                1
            );

            newState.currentTransitionPosition = this.state.startTransitionPosition
                .clone()
                .lerp( this.state.currentTransitionTarget, transitionPercent );

            if( transitionPercent >= 1 ) {

                this.advancing = false;
                this.props.advanceLevel( this.state.advanceToId, this.state.advanceToScale );
                this.playerBody.position.copy( newState.currentTransitionPosition );

                newState.currentTransitionPosition = null;
                newState.currentTransitionTarget = null;

            }

            this.setState( newState );
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

            if( currentTourPercent >= 1 && nextLevels.length ) {

                currentTourPercent = 0;
                this.props.advanceLevel( nextLevels[ 0 ].level.id, nextLevels[ 0 ].entity.scale.x );

            }

            newState.currentTourPercent = currentTourPercent;

            this.setState( newState );
            return;

        }

        Object.keys( this.wallCoolDowns ).forEach( ( key ) => {

            if( this.wallCoolDowns[ key ] + coolDownTimeMs < now ) {
                delete this.wallCoolDowns[ key ];
            }

        });

        if( KeyCodes['`'] in this.keysDown ) {

            if( !this.debugSwitch ) {
                newState.debug = !this.state.debug;
                this.debugSwitch = true;
            }

        } else {

            this.debugSwitch = false;

        }

        //let cameraDelta = 0;
        //if( KeyCodes.Z in this.keysDown ) {
            //cameraDelta = -0.1;
        //} else if( KeyCodes.X in this.keysDown ) {
            //cameraDelta = 0.1;
        //}

        //if( cameraDelta ) {

            //state.cameraPosition = new THREE.Vector3(
                //this.state.cameraPosition.x,
                //this.state.cameraPosition.y + cameraDelta,
                //this.state.cameraPosition.z
            //);

        //}

        // Lerp the camera position to the correct follow position. Lerp
        // components individually to make the (y) camera zoom to player
        // different
        newState.cameraPosition = new THREE.Vector3(
                 lerp( cameraPosition.x, playerPosition.x, 0.05 / playerScale ),
            lerp(
                cameraPosition.y,
                getCameraDistanceToPlayer( this.playerBody.position.y, cameraAspect, cameraFov, playerScale ),
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

                    this.advancing = true;
                    this.playerContact = {};

                    // this is almost certainly wrong to determine which way
                    // the finish line element is facing
                    const cardinality = getCardinalityOfVector(
                        new THREE.Vector3().applyQuaternion( entity.rotation )
                    );
                    const isUp = cardinality === Cardinality.DOWN || cardinality === Cardinality.UP;

                    const currentPosition = new THREE.Vector3().copy(
                        this.playerBody.position
                    );

                    // Calculate where to tween the player to. *>2 to move
                    // past the hit box for the level exit/entrance
                    newState.startTransitionPosition = currentPosition;
                    newState.currentTransitionPosition = currentPosition;
                    newState.currentTransitionTarget = new THREE.Vector3(
                        lerp( currentPosition.x, entity.position.x, isUp ? 0 : 2.5 ),
                        currentPosition.y,
                        lerp( currentPosition.z, entity.position.z, isUp ? 2.5 : 0 ),
                    );
                    newState.currentTransitionStartTime = now;

                    if( entity === previousLevelFinishEntity ) {

                        newState.advanceToId = previousLevelId;
                        newState.advanceToScale = previousLevel.entity.scale.x;

                    } else {

                        const nextLevel = [ ...nextLevels ].sort( ( a, b ) =>
                            a.entity.position.distanceTo( entity.position ) -
                            b.entity.position.distanceTo( entity.position )
                        )[ 0 ] || previousLevel;

                        newState.advanceToId = nextLevel.level.id;
                        newState.advanceToScale = nextLevel.entity.scale.x;
                    
                    }

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
                        1 + playerRadius,
                        playerPosition.z + radiusDiff
                    ),
                    newRadius,
                    playerDensity
                );

                this.world.addBody( playerBody );

                this.playerBody = playerBody;

                // Reset contact points
                this.playerContact = {};

                this.props.scalePlayer( currentLevel.id, entity.id, multiplier );

                newState.scaleStartTime = now;
                newState.radiusDiff = radiusDiff;

                break;

            }

        }

        if( newState.scaleStartTime || this.state.scaleStartTime ) {

            const scaleStartTime = newState.scaleStartTime || this.state.scaleStartTime;
            const currentScalePercent = 1 - ( ( now - scaleStartTime ) / scaleDurationMs );

            if( currentScalePercent <= 0 ) {

                newState.scaleStartTime = null;
                newState.radiusDiff = null;

            } else {

                newState.currentScalePercent = currentScalePercent;

            }

        }

        this.setState( newState );

    }

    onWindowBlur( event ) {

        this.keysDown = {};

    }

    onKeyDown( event ) {

        const which = { [ event.which ]: true };

        if( event.which === KeyCodes.SPACE ||
                event.which === KeyCodes.UP ||
                event.which === KeyCodes.DOWN
            ) {
            event.preventDefault();
        }

        this.keysDown = Object.assign( {}, this.keysDown, which );

    }

    onKeyUp( event ) {

        this.keysDown = without( this.keysDown, event.which );

    }

    render() {

        const {
            pushyPositions, time, cameraPosition, currentFlowPosition, debug,
            fps, touring, cameraTourTarget, entrance1, entrance2, tubeFlow,
            tubeIndex, currentScalePercent, radiusDiff,
            currentTransitionPosition, currentTransitionTarget
        } = ( this.state.debuggingReplay ? this.state.debuggingReplay[ this.state.debuggingIndex ] : this.state );

        const {
            playerRadius, playerScale, playerMass, nextLevels,
            nextLevelsEntitiesArray, previousLevel,
            previousLevelEntitiesArray, currentLevelRenderableEntitiesArray,
            previousLevelFinishEntity
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

        return <div>
            <React3
                mainCamera="camera"
                width={ gameWidth }
                height={ gameHeight }
                onAnimate={ this._onAnimate }
            >
                <scene
                    ref="scene"
                >

                    <perspectiveCamera
                        name="camera"
                        fov={ cameraFov }
                        aspect={ cameraAspect }
                        near={ 0.1 }
                        far={ 1000 }
                        position={ cameraPosition }
                        quaternion={ lookAt }
                        ref="camera"
                    />

                    <resources>
                        <boxGeometry
                            resourceId="1x1box"

                            width={1}
                            height={1}
                            depth={1}

                            widthSegments={1}
                            heightSegments={1}
                        />
                        <meshPhongMaterial
                            resourceId="playerMaterial"
                            color={ 0xFADE95 }
                        />
                        <meshPhongMaterial
                            resourceId="middleMaterial"
                            color={ 0x6E0AF2 }
                        />
                        <meshPhongMaterial
                            resourceId="entranceMaterial"
                            color={ 0xff0000 }
                        />
                        <meshPhongMaterial
                            resourceId="exitMaterial"
                            color={ 0x0000ff }
                        />

                        <sphereGeometry
                            resourceId="sphereGeometry"
                            radius={ 0.5 }
                            widthSegments={ 6 }
                            heightSegments={ 6 }
                        />

                        <planeBufferGeometry
                            resourceId="planeGeometry"
                            width={1}
                            height={1}
                            widthSegments={1}
                            heightSegments={1}
                        />

                        <meshPhongMaterial
                            resourceId="pushyMaterial"
                            color={ 0x462b2b }
                        />

                        <meshPhongMaterial
                            resourceId="floorSideMaterial"
                            color={ 0xee8a6f }
                            transparent
                            opacity={ 0.12 }
                        />

                        <meshPhongMaterial
                            resourceId="wallSideMaterial"
                            color={ 0xc1baa8 }
                            transparent
                            opacity={ 0.12 }
                        />

                        <shape resourceId="tubeWall">
                            <absArc
                                x={0}
                                y={0}
                                radius={0.5}
                                startAngle={0}
                                endAngle={Math.PI * 2}
                                clockwise={false}
                            />
                            <hole>
                                <absArc
                                    x={0}
                                    y={0}
                                    radius={0.4}
                                    startAngle={0}
                                    endAngle={Math.PI * 2}
                                    clockwise
                                />
                            </hole>
                        </shape>

                        <meshPhongMaterial
                            resourceId="tubeMaterial"
                            color={0xffffff}
                            side={ THREE.DoubleSide }
                            transparent
                        >
                            <texture
                                url={ require( '../Game/tube-pattern-1.png' ) }
                                wrapS={ THREE.RepeatWrapping }
                                wrapT={ THREE.RepeatWrapping }
                                anisotropy={16}
                            />
                        </meshPhongMaterial>

                        <meshPhongMaterial
                            resourceId="shrinkWrapMaterial"
                            color={ 0x462B2B }
                            opacity={ 0.3 }
                            transparent
                        />

                        <meshPhongMaterial
                            resourceId="shrinkMaterial"
                            color={0xffffff}
                            side={ THREE.DoubleSide }
                            transparent
                        >
                            <texture
                                url={ require( '../Game/spiral-texture.png' ) }
                                wrapS={ THREE.RepeatWrapping }
                                wrapT={ THREE.RepeatWrapping }
                                anisotropy={16}
                            />
                        </meshPhongMaterial>

                        <meshPhongMaterial
                            resourceId="growWrapMaterial"
                            color={ 0x462B2B }
                            opacity={ 0.3 }
                            transparent
                        />

                        <meshPhongMaterial
                            resourceId="growMaterial"
                            color={0xffffff}
                            side={ THREE.DoubleSide }
                            transparent
                        >
                            <texture
                                url={ require( '../Game/grow-texture.png' ) }
                                wrapS={ THREE.RepeatWrapping }
                                wrapT={ THREE.RepeatWrapping }
                                anisotropy={16}
                            />
                        </meshPhongMaterial>

                        <sphereGeometry
                            resourceId="playerGeometry"
                            radius={ 1 }
                            widthSegments={ 20 }
                            heightSegments={ 20 }
                        />

                    </resources>

                    <ambientLight
                        color={ 0x777777 }
                    />

                    <directionalLight
                        color={ 0xffffff }
                        intensity={ 1.0 }

                        castShadow

                        shadowMapWidth={1024}
                        shadowMapHeight={1024}

                        shadowCameraLeft={-shadowD}
                        shadowCameraRight={shadowD}
                        shadowCameraTop={shadowD}
                        shadowCameraBottom={-shadowD}

                        shadowCameraFar={3 * shadowD}
                        shadowCameraNear={shadowD}
                        shadowDarkness={0.5}

                        position={this.state.lightPosition}
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
                        ref="staticEntities"
                        entities={ currentLevelRenderableEntitiesArray }
                        time={ time }
                    />

                    { nextLevels.map( data => <StaticEntities
                        key={ data.level.id }
                        position={ data.entity.position }
                        scale={ data.entity.scale }
                        ref="nextLevel"
                        entities={ data.entities }
                        time={ time }
                    /> )}

                    { previousLevel && <StaticEntities
                        ref="previousLevel"
                        position={ previousLevel.entity.position }
                        scale={ previousLevel.entity.scale }
                        entities={ previousLevelEntitiesArray }
                        time={ time }
                        opacity={ 0.5 }
                    /> }

                    { debug && previousLevelFinishEntity && <mesh
                        position={ previousLevelFinishEntity.position }
                        scale={ previousLevelFinishEntity.scale.clone().multiply( new THREE.Vector3( 1, 2, 1 ) ) }
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

                    { debug && Object.keys( this.playerContact || {} ).map( ( key ) => {

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

                </scene>
            </React3>
            <br />
            FPS: { fps }
            <br />
            Player Scale: <input readOnly value={ playerScale } type="text" />
            <br />
            Player Mass: <input readOnly value={ playerMass } type="text" />
        </div>;
    }

}
