import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import CANNON from 'cannon/src/Cannon';
import Grid from './Grid';

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

import OrbitControls from 'three-orbit-controls';
const OrbitControlsThree = OrbitControls(THREE);

const radius = 20;
const speed = 0.1;
const clock = new THREE.Clock();

const height = 400;
const width = 400;

const shadowD = 20;

const playerRadius = 1.0;

const timeStep = 1 / 60;

const raycaster = new THREE.Raycaster();

const KeyCodes = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    X: 88,
    Y: 89,
    Z: 90
};

const textureCache = {};

function without( obj, ...keys ) {

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( keys.indexOf( parseFloat( key ) ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

function snapTo( number, interval ) {

    return ( interval * Math.ceil( number / interval ) ) - ( interval / 2 );

}

export default class Game extends Component {

    constructor(props, context) {
        super(props, context);

        this.keysDown = {};

        const gridSnap = 1;

        this.state = {
            gridSnap,
            gridScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
            isEditing: true,
            cameraTarget: new THREE.Vector3(0, 0, 0),
            cameraPosition: new THREE.Vector3(0, 7, 0),
            cameraRotation: new THREE.Euler(),
            cubeRotation: new THREE.Euler(),
            lightPosition: new THREE.Vector3(),
            meshStates: [],
            wallMeshStates: []
        };

        this.world = new CANNON.World();
        const world = this.world;

        //const walls = [];
        //this.walls = walls;

        this.bodies = [];
        const bodies = this.bodies;

        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;

        world.gravity.set(10, 0, 0);
        world.broadphase = new CANNON.NaiveBroadphase();

        const mass = 5;

        const playerBody = new CANNON.Body({ mass });
        this.playerBody = playerBody;

        playerBody.addEventListener( 'beginContact', () => {
            console.log('collision', arguments);
        });

        const playerShape = new CANNON.Sphere( playerRadius );
        this.playerShape = playerShape;

        playerBody.addShape(playerShape);
        playerBody.position.set( 0, 0, 0 );
        world.addBody(playerBody);
        bodies.push({
            scale: new THREE.Vector3( 1, 1, 1 ),
            geometry: 'playerGeometry',
            body: playerBody
        });

        const boxSize = 1.0;
        const boxShape = new CANNON.Box( new CANNON.Vec3( boxSize / 2, boxSize / 2, boxSize / 2 ) );

        // groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

        //const floor = makeWall(
        //new CANNON.Vec3( 10, 2, 10 ),
        //new CANNON.Vec3( 0, -2, 0 )
        //);

        //world.addBody( floor.body );
        //walls.push( floor );

        //const wallLeft = makeWall(
        //new CANNON.Vec3( 10, 2, 2 ),
        //new CANNON.Vec3( 0, 0, -5.75 )
        //);

        //world.addBody( wallLeft.body );
        //walls.push( wallLeft );

        //const wallRight = makeWall(
        //new CANNON.Vec3( 10, 2, 2 ),
        //new CANNON.Vec3( 0, 0, 5.75 )
        //);

        //world.addBody( wallRight.body );
        //walls.push( wallRight );

        //const wallTop = makeWall(
        //new CANNON.Vec3( 2, 2, 110 ),
        //new CANNON.Vec3( -5.75, 0, 0 )
        //);

        //world.addBody( wallTop.body );
        //walls.push( wallTop );

        //const wallBottom = makeWall(
        //new CANNON.Vec3( 2, 2, 10 ),
        //new CANNON.Vec3( 5.75, 0, 0 )
        //);

        //world.addBody( wallBottom.body );
        //walls.push( wallBottom );

        const shape = new CANNON.Sphere(0.1);
        const jointBody = new CANNON.Body({mass: 0});
        jointBody.addShape(shape);
        jointBody.collisionFilterGroup = 0;
        jointBody.collisionFilterMask = 0;

        world.addBody(jointBody);

        this.jointBody = jointBody;

        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this.updatePhysics = this.updatePhysics.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this._getMeshStates = this._getMeshStates.bind( this );
        this.onMouseMove = this.onMouseMove.bind( this );
        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseUp = this.onMouseUp.bind( this );
        this._onOrbitChange = this._onOrbitChange.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {

            this.setState({ isClient: true }, () => {
                window.addEventListener( 'keydown', this.onKeyDown );
                window.addEventListener( 'keyup', this.onKeyUp );

                const {
                    container,
                    camera,
                    mouseInput
                } = this.refs;

                const controls = new OrbitControlsThree(camera);

                controls.rotateSpeed = 1.0;
                controls.zoomSpeed = 1.2;
                controls.panSpeed = 0.8;
                controls.enableZoom = true;
                controls.enablePan = false;
                controls.enableDamping = true;
                controls.dampingFactor = 0.3;

                this.controls = controls;

                this.controls.addEventListener('change', this._onOrbitChange);

            });

        }

    }

    componentWillUnmount() {

        if( typeof window !== 'undefined' ) {

            window.removeEventListener( 'keydown', this.onKeyDown );
            window.removeEventListener( 'keyup', this.onKeyUp );
            this.controls.removeEventListener('change', this._onOrbitChange);

        }

    }

    _onOrbitChange() {
        this.setState({
            cameraPosition: this.refs.camera.position.clone(),
            cameraRotation: this.refs.camera.rotation.clone()
        });
    }

    updatePhysics() {

        let forceX = 0;
        const forceY = 0;
        let forceZ = 0;

        if( KeyCodes.LEFT in this.keysDown ) {
            forceZ += 1;
        }
        if( KeyCodes.RIGHT in this.keysDown ) {
            forceZ -= 1;
        }
        if( KeyCodes.UP in this.keysDown ) {
            forceX -= 1;
        }
        if( KeyCodes.DOWN in this.keysDown ) {
            forceX += 1;
        }

        this.playerBody.applyImpulse( new CANNON.Vec3( forceX, forceY, forceZ ), this.playerBody.position );

        // Step the physics world
        this.world.step(timeStep);

    }

    _getMeshStates( bodies ) {
        return bodies.map( ( { resourceId, scale, geometry, body }, bodyIndex) => {
            const { position, quaternion } = body;
            return {
                scale,
                geometry,
                resourceId,
                position: new THREE.Vector3().copy(position),
                quaternion: new THREE.Quaternion().copy(quaternion)
            };
        });
    }

    _onAnimate() {

        this.updatePhysics();

        const state = {
            wallTextures: Object.values( textureCache ),
            meshStates: this._getMeshStates( this.bodies ),
            //wallMeshStates: this._getMeshStates( this.walls ),
            lightPosition: new THREE.Vector3(
                radius * Math.sin( clock.getElapsedTime() * speed ),
                10,
                radius * Math.cos( clock.getElapsedTime() * speed )
            ),
            cubeRotation: new THREE.Euler(
                this.state.cubeRotation.x + 0.01,
                this.state.cubeRotation.y + 0.01,
                0
            )
        };

        let cameraDelta = 0;
        if( KeyCodes.Z in this.keysDown ) {
            cameraDelta = -0.1;
        } else if( KeyCodes.X in this.keysDown ) {
            cameraDelta = 0.1;
        }
        if( cameraDelta ) {
            state.cameraPosition = new THREE.Vector3(
                this.state.cameraPosition.x + cameraDelta * 0.5,
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

    onMouseMove( event ) {
        
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        //
        const bounds = this.refs.container.getBoundingClientRect();

        const mouse = {
            x: ( ( event.clientX - bounds.left ) / width ) * 2 - 1,
            y: -( ( event.clientY - bounds.top ) / height ) * 2 + 1
        };

        raycaster.setFromCamera( mouse, this.refs.camera );

        const intersections = raycaster
            .intersectObjects( this.refs.scene.children )
            .filter( ( intersection ) => {
                return intersection.object !== this.refs.previewPosition &&
                    intersection.object !== this.refs.createPreview;
            });

        if ( intersections.length > 0 ) {

            const point = intersections[ 0 ].point;
            const { gridSnap } = this.state;
            const snapEndPoint = new THREE.Vector3(
                snapTo( point.x, gridSnap ),
                snapTo( point.y, gridSnap ),
                snapTo( point.z, gridSnap )
            );

            if( this.state.dragCreating ) {

                const vectorDiff = snapEndPoint
                    .clone()
                    .sub( this.state.createPreviewStart );

                this.setState({
                    createPreviewPosition: snapEndPoint
                        .clone()
                        .add( this.state.createPreviewStart )
                        .multiplyScalar( 0.5 )
                        .setY( this.state.createPreviewStart.y ),
                    createPreviewScale: new THREE.Vector3(
                        Math.max( Math.abs( vectorDiff.x ), gridSnap ),
                        1,
                        Math.max( Math.abs( vectorDiff.z ), gridSnap )
                    ),
                    createPreviewEnd: snapEndPoint
                });

            } else {

                this.setState({ gridPreviewPosition: snapEndPoint });

            }

        } else {

            this.setState({ gridPreviewPosition: null });

        }

    }

    onMouseDown( event ) {

        if( this.state.gridPreviewPosition ) {

            this.controls.enabled = false;
            event.stopPropagation();

            this.setState({
                dragCreating: true,
                createPreviewStart: this.state.gridPreviewPosition.clone(),
                createPreviewScale: new THREE.Vector3( 1, 1, 1 ),
                createPreviewPosition: this.state.gridPreviewPosition.clone()
            });

        }

    }

    onMouseUp( event ) {

        if( this.state.dragCreating ) {

            this.controls.enabled = true;
            this.setState({
                dragCreating: false,
                dragStart: null
            });

        }

    }

    render() {

        if ( !this.state.isClient ) {
            return <div />;
        }

        const { wallTextures, meshStates } = this.state;

        //const wallMeshes = wallMeshStates.map( ( { resourceId, scale, geometry, position, quaternion }, i ) => {
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
        //resourceId={ resourceId }
        ///>
        //</mesh>;
        //});

        return <div
            onMouseMove={ this.onMouseMove }
            onMouseDown={ this.onMouseDown }
            onMouseUp={ this.onMouseUp }
            style={{ width, height }}
            ref="container"
        >
            <React3
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
                        rotation={this.state.cameraRotation}
                        ref="camera"
                    />

                    <resources>
                        <sphereGeometry
                            resourceId="playerGeometry"
                            radius={ playerRadius }
                            widthSegments={20}
                            heightSegments={20}
                        />
                        <boxGeometry
                            resourceId="wallGeometry"
                            width={1}
                            height={1}
                            depth={1}
                            widthSegments={1}
                            heightSegments={1}
                        />
                        <boxGeometry
                            resourceId="1x1box"

                            width={1}
                            height={1}
                            depth={1}

                            widthSegments={1}
                            heightSegments={1}
                        />
                        <meshPhongMaterial
                            resourceId="cubeMaterial"
                            color={0xffffff}
                            >
                            <textureResource
                                resourceId="ornateBrick"
                            />
                        </meshPhongMaterial>
                        <meshBasicMaterial
                            resourceId="transparentMaterial"
                            color={0xffffff}
                            opacity={0.2}
                            transparent
                            >
                            <textureResource
                                resourceId="ornateBrick"
                            />
                        </meshBasicMaterial>
                        <meshBasicMaterial
                            resourceId="previewBox"
                            color={0xff0000}
                            opacity={0.5}
                            transparent
                            >
                            <textureResource
                                resourceId="ornateBrick"
                            />
                        </meshBasicMaterial>
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
                        ref="grid"
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        rotation={ new THREE.Euler( 0, Math.PI / 2, 0 ) }
                        scale={ new THREE.Vector3( 20, 0.01, 20 ) }
                    >
                        <geometryResource
                            resourceId="1x1box"
                        />
                        <materialResource
                            resourceId="transparentMaterial"
                        />
                    </mesh>

                    { this.state.dragCreating ? <mesh
                        position={ this.state.createPreviewPosition }
                        scale={ this.state.createPreviewScale }
                        ref="createPreview"
                    >
                        <geometryResource
                            resourceId="1x1box"
                        />
                        <materialResource
                            resourceId="previewBox"
                        />
                    </mesh> : (
                        this.state.gridPreviewPosition && <mesh
                        scale={ this.state.gridScale }
                        position={ this.state.gridPreviewPosition }
                        ref="previewPosition"
                    >
                        <geometryResource
                            resourceId="1x1box"
                        />
                        <materialResource
                            resourceId="previewBox"
                        />
                    </mesh> ) }

                    <Grid
                        rows={ 20 }
                        columns={ 20 }
                        spacing={ this.state.gridSnap }
                    />

                </scene>
            </React3>
        </div>;
    }

}
