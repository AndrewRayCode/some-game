import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import CANNON from 'cannon/src/Cannon';
import StaticEntities from '../Dung/StaticEntities';
import {connect} from 'react-redux';
import KeyCodes from '../Dung/KeyCodes';
import TubeBend from '../Dung/TubeBend';
import TubeStraight from '../Dung/TubeStraight';

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

const radius = 20;
const speed = 0.1;
const clock = new THREE.Clock();

const height = 400;
const width = 400;

const shadowD = 20;
const boxes = 5;

const playerRadius = 0.45;
const playerScale = 1;

const tubeTravelDurationMs = 200;
const tubeStartTravelDurationMs = 50;

const coolDownTimeMs = 500;
const jumpForce = 50;
const moveForce = 2;
const airMoveForce = 0.5;

const timeStep = 1 / 60;
const raycaster = new THREE.Raycaster();

const vec3Equals = ( a, b ) => a.clone().sub( b ).length() < 0.0001;

const lerp = ( () => {
    const v = new THREE.Vector3();
    return v.lerpVectors.bind( v );
} )();

function resetBodyPhysics( body, position ) {

    // Position
    body.position.copy( position );
    body.previousPosition.copy( position );
    body.interpolatedPosition.copy( position );
    body.initPosition.copy( position );

    // orientation
    body.quaternion.set(0,0,0,1);
    body.initQuaternion.set(0,0,0,1);
    body.previousQuaternion.set(0,0,0,1);
    body.interpolatedQuaternion.set(0,0,0,1);

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

function getEntrancesForTube( tube ) {

    const { position, rotation, type } = tube;

    if( type === 'tube' ) {

        const rotatedQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new THREE.Vector3( 1, 0, 0 )
            .applyQuaternion( rotatedQuaternion );

        const entrance1 = position.clone().add( directionVector );
        const entrance2 = position.clone().sub( directionVector );

        const directionVectorScaled = directionVector
            .clone()
            .multiplyScalar( 0.5 );

        const threshold1 = position.clone().add( directionVectorScaled );
        const threshold2 = position.clone().sub( directionVectorScaled );

        return { tube, entrance1, entrance2, threshold1, threshold2 };

    } else if( type === 'tubebend' ) {

        const rotatedQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new THREE.Vector3( 1, 0, 0 )
            .applyQuaternion( rotatedQuaternion );

        const bentQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( -90 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVectorBent = new THREE.Vector3( 1, 0, 0 )
            .applyQuaternion( bentQuaternion );

        const entrance1 = position.clone().add( directionVector );
        const entrance2 = position.clone().add( directionVectorBent );

        const directionVectorScaled = directionVector
            .clone()
            .multiplyScalar( 0.5 );

        const bentDirectionVectorScaled = directionVectorBent
            .clone()
            .multiplyScalar( 0.5 );

        const threshold1 = position.clone().add( directionVectorScaled );
        const threshold2 = position.clone().add( bentDirectionVectorScaled );

        return { tube, entrance1, entrance2, threshold1, threshold2 };

    }

}

function findNextTube( tube, entrance, entities ) {

    const { entrance1, entrance2 } = getEntrancesForTube( tube );

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

        return getEntrancesForTube( nextTube );

    }

}

function snapTo( number, interval ) {

    return interval * Math.ceil( number / interval );

}

function without( obj, ...keys ) {

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( keys.indexOf( parseFloat( key ) ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

@connect(
    state => ({ entities: state.game })
)
export default class Game extends Component {

    constructor( props, context ) {
        super( props, context );

        this.keysDown = {};

        this.state = {
            playerContact: {},
            cameraPosition: new THREE.Vector3( 0, 7, 0 ),
            lightPosition: new THREE.Vector3(),
            meshStates: []
        };

        this.wallCoolDowns = {};

        const { entities } = this.props;

        this.world = new CANNON.World();
        const world = this.world;

        const bodies = [];

        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;

        world.gravity.set( 0, 0, 20 );
        world.broadphase = new CANNON.NaiveBroadphase();

        const mass = 5;

        const playerBody = new CANNON.Body({ mass });
        this.playerBody = playerBody;

        const playerShape = new CANNON.Sphere( playerRadius );

        playerBody.addShape(playerShape);
        playerBody.position.set( 0, 1.5, 0 );
        world.addBody( playerBody );
        bodies.push( playerBody );

        const physicsBodies = bodies.concat( entities.map( ( entity ) => {

            const { position, scale } = entity;
            const entityBody = new CANNON.Body({ mass: 0 });
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
            world.addBody( entityBody );
            return entityBody;

        }));

        this.physicsBodies = [];

        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this.updatePhysics = this.updatePhysics.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this._getMeshStates = this._getMeshStates.bind( this );
        this.onWorldContact = this.onWorldContact.bind( this );

    }

    componentDidMount() {

        window.addEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.onKeyUp );

        this.world.addEventListener( 'beginContact', this.onWorldContact );
        this.world.addEventListener( 'endContact', this.onWorldContact );

    }

    componentWillUnmount() {

        window.removeEventListener( 'keydown', this.onKeyDown );
        window.removeEventListener( 'keyup', this.onKeyUp );

        this.world.removeEventListener( 'beginContact', this.onWorldContact );
        this.world.removeEventListener( 'endContact', this.onWorldContact );

    }

    onWorldContact( event ) {

        const otherObject = event.bodyA === this.playerBody ? event.bodyB : (
            event.bodyB === this.playerBody ? event.bodyA : null
        );
        const { playerContact } = this.state;

        if( otherObject ) {
            
            if( event.type === 'endContact' ) {

                this.setState({ playerContact: without( playerContact, otherObject.id ) });

            } else {

                const assign = {
                    [ otherObject.id ]: true
                };
                this.setState({
                    playerContact: Object.assign( {}, playerContact, assign )
                });

            }

        }

    }

    updatePhysics() {

        const { entities } = this.props;
        const { playerContact } = this.state;
        const { keysDown } = this;
        let forceX = 0;
        let forceZ = 0;

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
        this.setState({playerSnapped});

        const contactKeys = Object.keys( playerContact );
        let tubeEntrances;

        if( !this.state.tubeFlow ) {

            for( let i = 0; i < contactKeys.length; i++ ) {
                const key = contactKeys[ i ];

                const physicsBody = this.world.bodies.find( ( entity ) => {
                    return entity.id.toString() === key;
                });

                const { entity } = physicsBody;
                if( entity.type === 'tube' || entity.type === 'tubebend') {

                    tubeEntrances = getEntrancesForTube( entity );
                    this.setState({
                        entrance1: tubeEntrances.entrance1,
                        entrance2: tubeEntrances.entrance2
                    });
                    break;

                }

            }
            
        }

        if( isLeft ) {
            forceX -= moveForce;
        }
        if( isRight ) {
            forceX += moveForce;
        }
        if( isUp ) {
            forceZ -= airMoveForce;
        }
        if( isDown ) {
            forceZ += airMoveForce;
        }

        let newTubeFlow;
        if( tubeEntrances ) {

            const { tube, entrance1, entrance2, threshold1, threshold2 } = tubeEntrances;
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

                newTubeFlow = [{
                    start: playerPosition.clone(),
                    end: thresholdPlayerStartsAt
                }, {
                    start: thresholdPlayerStartsAt,
                    end: thresholdPlayerEndsAt,
                    exit: isAtEntrance1 ? entrance2 : entrance1
                }];

                let nextTube;
                let currentTube = tube;
                let currentEntrance = entrancePlayerStartsAt;

                let failSafe = 0;
                while( failSafe < 30 && ( nextTube = findNextTube( currentTube, currentEntrance, entities ) ) ) {

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

                this.setState({
                    startTime: Date.now(),
                    tubeFlow: newTubeFlow,
                    currentFlowPosition: newTubeFlow[ 0 ].start,
                    tubeIndex: 0
                });

            }

        }

        const isFlowing = this.state.tubeFlow || newTubeFlow;

        if( this.state.tubeFlow ) {

            const time = Date.now();
            let { startTime, tubeIndex } = this.state;
            const { tubeFlow } = this.state;

            const isLastTube = tubeIndex === tubeFlow.length - 1;

            let currentPercent = ( time - startTime ) / ( tubeIndex === 0 ? tubeStartTravelDurationMs : tubeTravelDurationMs );
            let isDone;

            if( currentPercent >= 1 ) {

                //console.log('at end of tube...');

                if( isLastTube ) {
                    //console.log('FREE');
                    const lastTube = tubeFlow[ tubeIndex ];
                    isDone = true;
                    this.setState({
                        tubeFlow: null,
                        currentFlowPosition: null
                    });
                    resetBodyPhysics( this.playerBody, new CANNON.Vec3(
                        lastTube.exit.x,
                        lastTube.exit.y,
                        lastTube.exit.z
                    ) );
                } else {
                    //console.log('NEXT_TUBE');
                    tubeIndex++;
                    startTime = Date.now();
                    currentPercent = 0;
                }

            }

            const currentTube = tubeFlow[ tubeIndex ];

            if( !isDone ) {

                this.setState({
                    currentFlowPosition: lerp(
                        currentTube.start, isLastTube ? currentTube.exit : currentTube.end, currentPercent
                    ),
                    tubeIndex,
                    startTime
                });

            }

        }

        if( !isFlowing ) {

            if( KeyCodes.SPACE in keysDown ) {

                const coolDownKeys = Object.keys( this.wallCoolDowns );
                const canJump = Object.keys( playerContact ).find( ( key ) => {

                    return coolDownKeys.indexOf( key ) === -1;

                });

                if( canJump ) {

                    const coolDowns = {};
                    for( const key in playerContact ) {
                        coolDowns[ key ] = Date.now();
                    }

                    this.wallCoolDowns = Object.assign( {}, this.wallCoolDowns, coolDowns );

                    forceZ -= jumpForce;

                }

            }

            this.playerBody.applyImpulse(
                new CANNON.Vec3( forceX, 0, forceZ ),
                new CANNON.Vec3( 0, 0, 0 )
            );
            
        }

        // Step the physics world
        this.world.step( timeStep );

    }

    _getMeshStates( physicsBodies ) {

        return physicsBodies.map( ( body ) => {
            const { position, quaternion } = body;
            return {
                position: new THREE.Vector3().copy( position ),
                quaternion: new THREE.Quaternion().copy( quaternion )
            };
        });

    }

    _onAnimate() {

        this.updatePhysics();

        const state = {
            meshStates: this._getMeshStates( this.physicsBodies ),
            lightPosition: new THREE.Vector3(
                radius * Math.sin( clock.getElapsedTime() * speed ),
                10,
                radius * Math.cos( clock.getElapsedTime() * speed )
            )
        };

        Object.keys( this.wallCoolDowns ).forEach( ( key ) => {

            if( this.wallCoolDowns[ key ] + coolDownTimeMs < Date.now() ) {
                delete this.wallCoolDowns[ key ];
            }

        });

        if( KeyCodes.ESC in this.keysDown ) {
            this.props.onGameEnd();
        }

        let cameraDelta = 0;
        if( KeyCodes.Z in this.keysDown ) {
            cameraDelta = -0.1;
        } else if( KeyCodes.X in this.keysDown ) {
            cameraDelta = 0.1;
        }

        if( cameraDelta ) {
            state.cameraPosition = new THREE.Vector3(
                this.state.cameraPosition.x,
                this.state.cameraPosition.y + cameraDelta,
                this.state.cameraPosition.z
            );
        }

        this.setState( state );

    }

    onKeyDown( event ) {

        const which = { [ event.which ]: true };
        this.keysDown = Object.assign( {}, this.keysDown, which );

    }

    onKeyUp( event ) {

        this.keysDown = without( this.keysDown, event.which );

    }

    render() {

        const { meshStates } = this.state;
        const { entities } = this.props;

        //const cubeMeshes = meshStates.map( ( { scale, geometry, position, quaternion }, i ) => {
            //return <mesh
                //key={i}
                //position={position}
                //quaternion={quaternion}
                //scale={scale}
                //castShadow
            //>
                //<geometryResource
                    //resourceId={ geometry }
                ///>
                //<materialResource
                    //resourceId="cubeMaterial"
                ///>
            //</mesh>;
        //});

        return <React3
            mainCamera="camera"
            width={width}
            height={height}
            onAnimate={this._onAnimate}
        >
            <scene
                ref="scene"
            >

                <perspectiveCamera
                    name="camera"
                    fov={75}
                    aspect={width / height}
                    near={0.1}
                    far={1000}
                    position={this.state.cameraPosition}
                    rotation={ new THREE.Euler( -Math.PI / 2, 0, 0 )}
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
                    <sphereGeometry
                        resourceId="playerGeometry"
                        radius={ playerRadius }
                        widthSegments={ 20 }
                        heightSegments={ 20 }
                    />
                    <meshPhongMaterial
                        resourceId="playerMaterial"
                        color={ 0xffffff }
                    />
                    <meshPhongMaterial
                        resourceId="entranceMaterial"
                        color={ 0xff0000 }
                    />
                    <meshPhongMaterial
                        resourceId="exitMaterial"
                        color={ 0x0000ff }
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

                <mesh
                    ref="player"
                    position={ new THREE.Vector3().copy( this.state.currentFlowPosition || this.playerBody.position ) }
                    quaternion={ new THREE.Quaternion().copy( this.playerBody.quaternion ) }
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="playerMaterial"
                    />
                </mesh>

                { this.state.tubeFlowx && <mesh
                    position={ this.state.tubeFlow[ this.state.tubeIndex ].start }
                    scale={ new THREE.Vector3( 0.5, 2, 0.5 )}
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="entranceMaterial"
                    />
                </mesh> }
                { this.state.tubeFlowx && <mesh
                    position={ this.state.tubeIndex === this.state.tubeFlow.length - 1 ?
                        this.state.tubeFlow[ this.state.tubeIndex ].exit :
                        this.state.tubeFlow[ this.state.tubeIndex ].end
                    }
                    scale={ new THREE.Vector3( 2, 0.5, 2 )}
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="exitMaterial"
                    />
                </mesh> }

                { this.state.entrance1x && <mesh
                    position={ this.state.entrance1 }
                    scale={ new THREE.Vector3( 0.5, 2, 0.5 )}
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="playerMaterial"
                    />
                </mesh> }
                { this.state.entrance2x && <mesh
                    position={ this.state.entrance2 }
                    scale={ new THREE.Vector3( 0.5, 2, 0.5 )}
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="exitMaterial"
                    />
                </mesh> }
                { this.state.playerSnappedx && <mesh
                    position={this.state.playerSnapped }
                    scale={ new THREE.Vector3( 0.1, 3.5, 0.1 )}
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="exitMaterial"
                    />
                </mesh> }

                <StaticEntities
                    ref="staticEntities"
                    entities={ entities }
                />

                { [/*1,2,3,4*/].map( ( i ) => {

                    let e;
                    switch(i) {
                        case 1:
                            e = new THREE.Quaternion( 0, 0, 0, 1 )
                                .clone()
                                .multiply( new THREE.Quaternion()
                                    .setFromEuler( new THREE.Euler(
                                        THREE.Math.degToRad( 90 ),
                                        THREE.Math.degToRad( 0 ),
                                        0
                                    ) )
                                );
                            break;
                        case 2:
                            e = new THREE.Quaternion( 0, 0, 0, 1 )
                                .clone()
                                .multiply( new THREE.Quaternion()
                                    .setFromEuler( new THREE.Euler(
                                        THREE.Math.degToRad( 0 ),
                                        THREE.Math.degToRad( -90 ),
                                        0
                                    ) )
                                );
                            break;
                        case 3:
                            e = new THREE.Quaternion( 0, 0, 0, 1 )
                                .clone()
                                .multiply( new THREE.Quaternion()
                                    .setFromEuler( new THREE.Euler(
                                        THREE.Math.degToRad( -90 ),
                                        THREE.Math.degToRad( 90 ),
                                        0
                                    ) )
                                );
                            break;
                        case 4:
                            e = new THREE.Quaternion( 0, 0, 0, 1 )
                                .clone()
                                .multiply( new THREE.Quaternion()
                                    .setFromEuler( new THREE.Euler(
                                        THREE.Math.degToRad( 180 ),
                                        THREE.Math.degToRad( -90 ),
                                        0
                                    ) )
                                );
                            break;
                        default:
                            console.log('gfy');
                    }

                    const position = new THREE.Vector3( ( i * 3 ) - 7, 3, 0 );

                    const { entrance1, entrance2 } = getEntrancesForTube({
                        position, rotation: e, type: 'tubebend'
                    });

                    return <group key={i}>

                        <mesh
                            position={ entrance1 }
                            scale={ new THREE.Vector3( 0.5, 2, 0.5 )}
                        >
                            <geometryResource
                                resourceId="playerGeometry"
                            />
                            <materialResource
                                resourceId="playerMaterial"
                            />
                        </mesh>
                        <mesh
                            position={ entrance2 }
                            scale={ new THREE.Vector3( 0.5, 2, 0.5 )}
                        >
                            <geometryResource
                                resourceId="playerGeometry"
                            />
                            <materialResource
                                resourceId="exitMaterial"
                            />
                        </mesh>

                        <TubeBend
                            key={ i }
                            position={ position }
                            rotation={ e }
                            scale={ new THREE.Vector3(1,1,1)}
                            materialId="tubeMaterial"
                        />

                    </group>;

                } ) }

            </scene>
        </React3>;
    }

}
