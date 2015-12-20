import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import Grid from './Grid';
import {connect} from 'react-redux';
import {addWall} from '../../redux/modules/game';
import {bindActionCreators} from 'redux';
import classNames from 'classnames/bind';
import styles from './Dung.scss';
const cx = classNames.bind( styles );

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

const raycaster = new THREE.Raycaster();

const KeyCodes = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,

    ALT: 18,
    CTRL: 17,
    ESC: 27,

    '[': 219,
    ']': 221,

    C: 67,
    X: 88,
    Y: 89,
    Z: 90
};

function without( obj, ...keys ) {

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( keys.indexOf( parseFloat( key ) ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

function snapTo( number, interval ) {

    return interval * Math.ceil( number / interval );

}

@connect(
    state => ({ walls: state.game }),
    dispatch => bindActionCreators({addWall}, dispatch)
)
export default class Dung extends Component {

    constructor(props, context) {
        super(props, context);

        this.keysPressed = {};

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
            wallMeshStates: [],

            gridBasePosition: new THREE.Vector3( 0, 0, 0 ),
            gridBaseRotation: new THREE.Euler( 0, Math.PI / 2, 0 ),
            gridBaseScale: new THREE.Vector3( 200, 0.00001, 200 ),

            gridPosition: new THREE.Vector3( 0, 0, 0 )
        };

        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
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

    _setStateFromKey( state, keys ) {

        let stateKey;
        if( KeyCodes.C in keys ) {
            stateKey = 'creating';
        } else if( KeyCodes.ESC in keys ) {
            stateKey = 'selecting';
        }

        if( stateKey ) {

            const update = { [ stateKey ]: true };
            return Object.assign( {}, state, {
                creating: false,
                selecting: false
            }, update );

        }

        return state;
        
    }

    _onAnimate() {

        const rotateable = ( KeyCodes.CTRL in this.keysPressed ) ||
            ( KeyCodes.ALT in this.keysPressed );

        if( rotateable ) {

            this.controls.enabled = true;

        } else {

            this.controls.enabled = true;

        }

        let state = {
            rotateable,
            lightPosition: new THREE.Vector3(
                radius * Math.sin( clock.getElapsedTime() * speed ),
                10,
                radius * Math.cos( clock.getElapsedTime() * speed )
            ),
            cubeRotation: new THREE.Euler(
                this.state.cubeRotation.x + 0.01,
                this.state.cubeRotation.y + 0.01,
                0
            ),
        };

        if( KeyCodes[ '[' ] in this.keysPressed ) {

            if( !this.snapChange ) {
                state.gridSnap = this.state.gridSnap / 2;
                state.gridScale = new THREE.Vector3( state.gridSnap, state.gridSnap, state.gridSnap );
                this.snapChange = true;
            }

        } else if( KeyCodes[ ']' ] in this.keysPressed ) {

            if( !this.snapChange ) {
                state.gridSnap = this.state.gridSnap * 2;
                state.gridScale = new THREE.Vector3( state.gridSnap, state.gridSnap, state.gridSnap );
                this.snapChange = true;
            }

        } else {

            this.snapChange = false;

        }

        state = this._setStateFromKey( state, this.keysPressed );

        let cameraDelta = 0;

        if( KeyCodes.Z in this.keysPressed ) {

            cameraDelta = -0.1;

        } else if( KeyCodes.X in this.keysPressed ) {

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

        const { which } = event;
        const whichMap = { [ which ]: true };
        this.keysPressed = Object.assign( {}, this.keysPressed, whichMap );

    }

    onKeyUp( event ) {

        const { which } = event;
        this.keysPressed = without( this.keysPressed, which );

    }

    onMouseMove( event ) {
        
        const bounds = this.refs.container.getBoundingClientRect();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const mouse = {
            x: ( ( event.clientX - bounds.left ) / width ) * 2 - 1,
            y: -( ( event.clientY - bounds.top ) / height ) * 2 + 1
        };

        raycaster.setFromCamera( mouse, this.refs.camera );

        const intersections = raycaster
            .intersectObjects( this.refs.scene.children, true )
            .filter( ( intersection ) => {
                return intersection.object !== this.refs.previewPosition &&
                    intersection.object !== this.refs.createPreview &&
                    !( intersection.object instanceof THREE.Line );
            })
            .sort( ( a, b ) => {
                return a.distance - b.distance;
            });

        if ( intersections.length > 0 ) {

            const { gridSnap } = this.state;
            const faceNormal = intersections[ 0 ].face.normal.clone().normalize();
            const point = intersections[ 0 ].point
                .clone()
                .add( faceNormal.multiplyScalar( gridSnap / 2 ) );

            const snapEndPoint = new THREE.Vector3(
                snapTo( point.x, gridSnap ),
                snapTo( point.y, gridSnap ),
                snapTo( point.z, gridSnap )
            ).addScalar( -gridSnap / 2 );

            if( this.state.dragCreating ) {

                const vectorDiff = snapEndPoint
                    .clone()
                    .sub( this.state.createPreviewStart );

                this.setState({
                    createPreviewPosition: snapEndPoint
                        .clone()
                        .add( this.state.createPreviewStart )
                        .multiplyScalar( 0.5 ),
                    createPreviewScale: new THREE.Vector3(
                        Math.max( Math.abs( vectorDiff.x ) + gridSnap, gridSnap ),
                        gridSnap,
                        Math.max( Math.abs( vectorDiff.z ) + gridSnap, gridSnap )
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

        const { gridSnap, rotateable, gridPreviewPosition, creating } = this.state;

        if( rotateable ) {

            this.setState({
                rotating: true
            });

        } else if( creating && gridPreviewPosition ) {

            this.controls.enabled = false;
            event.stopPropagation();

            this.setState({
                dragCreating: true,
                createPreviewStart: gridPreviewPosition.clone(),
                createPreviewScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
                createPreviewPosition: gridPreviewPosition.clone()
            });

        }

    }

    onMouseUp( event ) {

        if( this.state.rotateable ) {

            this.setState({
                rotating: false
            });

        }

        if( this.state.dragCreating ) {

            this.props.addWall(
                this.state.createPreviewPosition, this.state.createPreviewScale
            );

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

        let editorState = 'None';
        if( this.state.rotateable ) {

            editorState = 'Rotating';

        } else if( this.state.creating ) {

            editorState = 'Create';

        } else if( this.state.selecting ) {

            editorState = 'Select';

        }

        const { walls } = this.props;
        const { meshStates } = this.state;

        return <div>
            <div className="clearfix">
                <div
                    onMouseMove={ this.onMouseMove }
                    onMouseDown={ this.onMouseDown }
                    onMouseUp={ this.onMouseUp }
                    style={{ width, height }}
                    className={ cx({
                        canvas: true,
                        rotateable: this.state.rotateable,
                        rotating: this.state.rotating,
                        creating: this.state.creating
                    }) }
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
                                <meshBasicMaterial
                                    resourceId="transparentMaterial"
                                    color={0xffffff}
                                    opacity={0.4}
                                    transparent
                                />
                                <meshBasicMaterial
                                    resourceId="previewBox"
                                    color={0xff0000}
                                    opacity={0.5}
                                    transparent
                                />
                                <meshPhongMaterial
                                    resourceId="ornateWall"
                                    color={ 0xffffff }
                                >
                                    <texture
                                        url={ require( './brick-pattern-ornate.png' ) }
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
                                ref="grid"
                                position={ this.state.gridBasePosition }
                                rotation={ this.state.gridBaseRotation }
                                scale={ this.state.gridBaseScale }
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
                            </mesh> : ( !( this.state.rotateable ) && this.state.creating && this.state.gridPreviewPosition && <mesh
                                scale={ this.state.gridScale }
                                position={ this.state.gridPreviewPosition }
                                ref="previewPosition"
                                castShadow
                            >
                                <geometryResource
                                    resourceId="1x1box"
                                />
                                <materialResource
                                    resourceId="previewBox"
                                />
                            </mesh> ) }

                            { this.props.walls.map( ( wall ) => {
                                return <mesh
                                    key={ wall.id }
                                    position={ wall.position }
                                    scale={ wall.scale }
                                    castShadow
                                    receiveShadow
                                >
                                    <geometryResource
                                        resourceId="1x1box"
                                    />
                                    <materialResource
                                        resourceId="ornateWall"
                                    />
                                </mesh>;
                            }) }

                            <Grid
                                position={ this.state.gridPosition }
                                rows={ 20 }
                                columns={ 20 }
                                spacing={ this.state.gridSnap }
                            />

                        </scene>
                    </React3>
                </div>
                <div className={ cx({ sidebar: true }) }>
                    sidebar
                </div>
            </div>
            <div>
                State: { editorState }
            </div>
        </div>;
    }

}
