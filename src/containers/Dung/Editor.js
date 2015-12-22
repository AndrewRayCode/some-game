import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import Grid from './Grid';
import {connect} from 'react-redux';
import {addEntity, removeEntity} from '../../redux/modules/game';
import {bindActionCreators} from 'redux';
import classNames from 'classnames/bind';
import styles from './Dung.scss';
import TubeBend from './TubeBend';
import TubeStraight from './TubeStraight';
import StaticEntities from './StaticEntities';
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

const tubeRadius = 0.5;
const randomSpline = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, tubeRadius, 0 ),
    new THREE.Vector3( tubeRadius, tubeRadius )
);

const extrudeSettings = {
    curveSegments: 50,
    amount: 10,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 18,
    bevelSize: 0,
    closed: false,
    extrudePath: randomSpline,
    bevelThickness: 0
};

const raycaster = new THREE.Raycaster();

const KeyCodes = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,

    ALT: 18,
    CTRL: 17,
    ESC: 27,
    DEL: 8,

    '[': 219,
    ']': 221,
    ',': 188,
    '.': 190,

    1: 49,
    2: 50,
    3: 51,
    4: 52,

    B: 66,
    G: 71,
    C: 67,
    S: 83,
    T: 84,
    W: 87,
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
    state => ({ entities: state.game }),
    dispatch => bindActionCreators({addEntity, removeEntity}, dispatch)
)
export default class Editor extends Component {

    constructor(props, context) {
        super(props, context);

        this.keysPressed = {};

        const gridSnap = 1;

        this.state = {
            gridSnap,
            gridScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
            createType: 'wall',
            selecting: true,
            createPreviewRotation: new THREE.Euler( 0, 0, 0 ),
            cameraPosition: new THREE.Vector3(0, 7, 0),
            cameraRotation: new THREE.Euler(),
            cubeRotation: new THREE.Euler(),
            lightPosition: new THREE.Vector3(),

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
        this.selectType = this.selectType.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {

            window.THREE = THREE;

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

        let copy = state;
        let stateKey;
        let createType;

        if( KeyCodes.C in keys ) {

            stateKey = 'creating';

        } else if( ( KeyCodes.ESC in keys ) || ( KeyCodes.S in keys ) ) {

            stateKey = 'selecting';

        }

        if( this.state.creating ) {

            if( KeyCodes.W in keys ) {

                createType = 'wall';

            } else if( KeyCodes.T in keys ) {

                createType = 'tube';

            } else if( KeyCodes.B in keys ) {

                createType = 'tubebend';

            }

            if( createType ) {

                copy = Object.assign( {}, copy, { createType } );

            }

        }

        if( KeyCodes.G in keys ) {

            this.props.onEditorSwitch();

        }

        if( stateKey ) {

            const update = { [ stateKey ]: true };
            copy = Object.assign( {}, copy, {
                createPreviewRotation: new THREE.Euler( 0, 0, 0 ),
                creating: false,
                selecting: false
            }, update );

        }

        return copy;
        
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

        let rotationChange;
        if( KeyCodes[ '1' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( 0, -Math.PI / 2, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '2' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( 0, Math.PI / 2, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '3' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( -Math.PI / 2, 0, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '4' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( Math.PI / 2, 0, 0 );
                this.rotateChange = true;
            }

        } else {

            this.rotateChange = false;

        }
        if( rotationChange ) {
            state.createPreviewRotation = new THREE.Euler().setFromVector3(
                this.state.createPreviewRotation
                    .toVector3()
                    .add( rotationChange )
            );
        }

        state = this._setStateFromKey( state, this.keysPressed );

        if( this.state.selecting && ( KeyCodes.X in this.keysPressed ) && this.state.selectedObject ) {

            this.setState({ selectedObject: null });
            this.props.removeEntity( this.state.selectedObject.id );
            
        }

        let cameraDelta = 0;
        if( KeyCodes[ '.' ] in this.keysPressed ) {

            cameraDelta = -0.1;

        } else if( KeyCodes[ ',' ] in this.keysPressed ) {

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
                    intersection.object !== (
                        this.refs.previewPosition &&
                        this.refs.previewPosition.refs &&
                        this.refs.previewPosition.refs.mesh
                    ) &&
                    intersection.object !== this.refs.createPreview &&
                    !( intersection.object instanceof THREE.Line );
            })
            .sort( ( a, b ) => {
                return a.distance - b.distance;
            });

        if ( this.state.selecting ) {

            this.setState({
                objectUnderCursor: intersections.length ?
                    this.props.entities.find( ( entity ) => {

                        const ref = this.refs[ entity.id ];

                        return ref === intersections[ 0 ].object ||
                            ref.refs && ref.refs.mesh === intersections[ 0 ].object;

                    }) : null
            });

        }

        if ( this.state.creating && intersections.length ) {

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

                this.setState({ createPreviewPosition: snapEndPoint });

            }

        } else {

            this.setState({ createPreviewPosition: null });

        }

    }

    onMouseDown( event ) {

        const { gridSnap, rotateable, createPreviewPosition, creating, selecting, objectUnderCursor } = this.state;

        if( rotateable ) {

            this.setState({
                rotating: true
            });

        } else if( selecting && objectUnderCursor ) {

            this.setState({ selectedObject: objectUnderCursor });

        } else if( creating && createPreviewPosition ) {

            this.controls.enabled = false;
            event.stopPropagation();

            this.setState({
                dragCreating: true,
                createPreviewStart: createPreviewPosition.clone(),
                createPreviewScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
                createPreviewPosition: createPreviewPosition.clone()
            });

        }

    }

    onMouseUp( event ) {

        const {
            rotateable, dragCreating, createType, createPreviewPosition,
            createPreviewScale, createPreviewRotation
        } = this.state;

        if( rotateable ) {

            this.setState({
                rotating: false
            });

        }

        if( dragCreating ) {

            this.props.addEntity(
                createType, createPreviewPosition, createPreviewScale, createPreviewRotation
            );

            this.controls.enabled = true;
            this.setState({
                dragCreating: false,
                dragStart: null
            });

        }

    }

    selectType( createType ) {

        return ( event ) => {
            event.preventDefault();
            this.setState({ createType });
        };

    }

    render() {

        let editorState = 'None';
        if( this.state.rotateable ) {

            editorState = 'Rotating';

        } else if( this.state.creating ) {

            editorState = 'Create';

        } else if( this.state.selecting ) {

            editorState = 'Select';

        }

        const { entities } = this.props;
        const {
            createType, selecting, selectedObject, creating, rotateable,
            createPreviewPosition, gridScale, createPreviewRotation, gridSnap
        } = this.state;

        let previewObject = null;

        if( !rotateable && creating && createPreviewPosition ) {

            if( createType === 'wall' ) {

                previewObject = <mesh
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    castShadow
                >
                    <geometryResource
                        resourceId="1x1box"
                    />
                    <materialResource
                        resourceId="ghostMaterial"
                    />
                </mesh>;

            } else if( createType === 'tube' ) {

                previewObject = <TubeStraight
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            } else if( createType === 'tubebend' ) {

                previewObject = <TubeBend
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            }

        }

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
                        creating: creating
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
                                <meshPhongMaterial
                                    resourceId="ghostMaterial"
                                    color={0xff0000}
                                    opacity={0.5}
                                    transparent
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
                                    resourceId="ghostMaterial"
                                />
                            </mesh> : previewObject }

                            { this.state.creating && <StaticEntities
                                entities={ entities }
                            /> }

                            <Grid
                                position={ this.state.gridPosition }
                                rows={ 20 }
                                columns={ 20 }
                                spacing={ gridSnap }
                            />

                        </scene>

                    </React3>
                </div>

                <div className={ cx({ sidebar: true }) }>
                    { selecting && selectedObject ? (<div>
                        <b>Selected Object</b>
                        <br />
                        <b>id</b>: {selectedObject.id}
                        <br />
                        <b>scale</b>: {selectedObject.scale.x} {selectedObject.scale.y} {selectedObject.scale.z}
                        <br />
                        <b>position</b>: {selectedObject.position.x} {selectedObject.position.y} {selectedObject.position.z}
                    </div>) : null }

                    { creating ? (<div>
                        <b>Create</b>
                        <br />
                        [W] { createType === 'wall' && '✓' }
                        <button onClick={ this.selectType( 'wall' ) }>
                            Wall
                        </button>
                        <br />
                        [T] { createType === 'tube' && '✓' }
                        <button onClick={ this.selectType( 'tube' ) }>
                            Tube Straight
                        </button>
                        <br />
                        [B] { createType === 'tubebend' && '✓' }
                        <button onClick={ this.selectType( 'tubebend' ) }>
                            Tube Bend
                        </button>
                    </div>) : null }
                </div>
            </div>
            <div>
                State: { editorState }
                <br />
                Grid Snap: { gridSnap }
            </div>
        </div>;
    }

}
