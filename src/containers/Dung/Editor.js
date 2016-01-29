import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import Grid from './Grid';
import { connect } from 'react-redux';
import {
    rotateEntity, moveEntity, addEntity, removeEntity, changeEntityMaterial,
    addLevel, selectLevel, saveLevel, updateLevel, deserializeLevels,
    renameLevel, addNextLevel, removeNextLevel, insetLevel, changeEntityType
} from '../../redux/modules/editor';
import { bindActionCreators } from 'redux';
import classNames from 'classnames/bind';
import styles from './Dung.scss';
import Wall from './Wall';
import Floor from './Floor';
import TubeBend from './TubeBend';
import TubeStraight from './TubeStraight';
import Player from './Player';
import StaticEntities from './StaticEntities';
import KeyCodes from './KeyCodes';
import Shrink from './Shrink';
import Grow from './Grow';
import Textures from './Textures';
const cx = classNames.bind( styles );

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

THREE.TextureLoader.prototype.crossOrigin = '';

import OrbitControls from 'three-orbit-controls';
const OrbitControlsThree = OrbitControls( THREE );

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
    ( state ) => {

        const { levels } = state;
        const currentLevelId = state.currentEditorLevel;
        const allEntities = state.entities;

        if( currentLevelId ) {

            const currentLevel = levels[ currentLevelId ];

            const {
                currentLevelAllEntities,
                currentLevelStaticEntities,
                nextLevelEntityData
            } = currentLevel.entityIds.reduce( ( memo, id ) => {
                const entity = allEntities[ id ];

                if( entity.type === 'level' ) {
                    memo.nextLevelEntityData = allEntities[ id ];
                    memo.currentLevelAllEntities[ id ] = entity;
                } else {
                    memo.currentLevelAllEntities[ id ] = entity;
                    memo.currentLevelStaticEntities[ id ] = entity;
                }

                return memo;
            }, {
                currentLevelAllEntities: {},
                currentLevelStaticEntities: {}
            });

            // Determine next level data
            const nextLevelId = currentLevel.nextLevelId;
            const /* this shit is */nextLevel = nextLevelId && levels[ nextLevelId ];

            const nextLevelEntity = nextLevelId && {
                level: nextLevel,
                ...nextLevelEntityData
            };

            const nextLevelEntitiesArray = nextLevel && nextLevel.entityIds
                .map( id => allEntities[ id ] )
                .filter( entity => entity.type !== 'level' );

            // Determine previous level data
            const previousLevelId = Object.keys( levels ).find(
                levelId => levels[ levelId ].nextLevelId === currentLevelId
            );
            const previousLevelData = previousLevelId && levels[ previousLevelId ];

            const previousLevelEntityData = previousLevelData && allEntities[
                previousLevelData.entityIds.find(
                    id => allEntities[ id ].type === 'level'
                )
            ];

            const isPreviousLevelBigger = previousLevelData &&
                previousLevelEntityData.scale.x > 1;
            const multiplier = isPreviousLevelBigger ? 0.125 : 8;
            const previousLevelEntity = previousLevelData && {
                level: previousLevelData,
                ...previousLevelEntityData,
                scale: new THREE.Vector3( multiplier, multiplier, multiplier ),
                position: previousLevelEntityData.position
                    .clone()
                    .multiply(
                        new THREE.Vector3( -multiplier, multiplier, -multiplier )
                    )
                    .setY( isPreviousLevelBigger ? 0.875 : -7 )
            };

            const previousLevelEntitiesArray = previousLevelData && previousLevelData.entityIds
                .map( id => allEntities[ id ] )
                .filter( entity => entity.type !== 'level' );

            return {
                levels, currentLevel, currentLevelId, currentLevelAllEntities,
                currentLevelStaticEntities, allEntities, nextLevelId,
                nextLevelEntity, nextLevel, nextLevelEntitiesArray,
                previousLevelEntity, previousLevelEntitiesArray,
                currentLevelAllEntitiesArray: Object.values( currentLevelAllEntities ),
                currentLevelStaticEntitiesArray: Object.values( currentLevelStaticEntities ),
            };

        }

        return { levels, allEntities };

    },
    dispatch => bindActionCreators({
        addEntity, removeEntity, moveEntity, rotateEntity,
        changeEntityMaterial, addNextLevel, selectLevel, saveLevel,
        updateLevel, deserializeLevels, renameLevel, addLevel, removeNextLevel,
        insetLevel, changeEntityType
    }, dispatch )
)
export default class Editor extends Component {

    constructor( props, context ) {

        super( props, context );

        this.keysPressed = {};

        const gridSnap = 1;

        this.state = {
            gridSnap,
            gridScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
            createMaterialId: 'ornateWall1',
            createType: 'wall',
            selecting: true,
            createPreviewRotation: new THREE.Quaternion( 0, 0, 0, 1 ),
            cameraPosition: new THREE.Vector3(0, 7, 0),
            cameraRotation: new THREE.Euler(0, 0, 0),
            lightPosition: new THREE.Vector3(),

            gridBasePosition: new THREE.Vector3( 0, 0, 0 ),
            gridBaseRotation: new THREE.Euler( 0, Math.PI / 2, 0 ),
            gridBaseScale: new THREE.Vector3( 200, 0.00001, 200 ),

            insertLevelId: Object.keys( props.levels || {} )[ 0 ],
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
        this.selectMaterialId = this.selectMaterialId.bind( this );
        this.changeMaterialId = this.changeMaterialId.bind( this );
        this.onLevelCreateChange = this.onLevelCreateChange.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {

            window.THREE = THREE;

            window.addEventListener( 'keydown', this.onKeyDown );
            window.addEventListener( 'keyup', this.onKeyUp );

            if( this.props.currentLevelId ) {

                this._setUpOrbitControls();

            }

            // This is bad. Fix it later
            setTimeout( () => {
                this.props.deserializeLevels();
            }, 0 );

        }

    }

    componentDidUpdate( prevProps ) {

        if( !this.controls && this.props.currentLevelId ) {

            this._setUpOrbitControls();

        }

    }

    onLevelCreateChange( event ) {

        this.setState({
            insertLevelId: event.target.value
        });

    }

    _setUpOrbitControls() {

        const {
            container,
            camera,
        } = this.refs;

        const controls = new OrbitControlsThree( camera, container );

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.3;

        this.controls = controls;

        this.controls.addEventListener( 'change', this._onOrbitChange );

    }

    componentWillUnmount() {

        if( typeof window !== 'undefined' ) {

            window.removeEventListener( 'keydown', this.onKeyDown );
            window.removeEventListener( 'keyup', this.onKeyUp );

            if( this.controls ) {
                this.controls.removeEventListener('change', this._onOrbitChange);
            }

        }

    }

    componentWillReceiveProps( nextProps ) {

        // Get the selected level id if levels weren't available on first mount
        if( nextProps.levels && !this.state.insertLevelId ) {
            this.setState({
                insertLevelId: Object.keys( nextProps.levels )[ 0 ]
            });
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

            } else if( KeyCodes.F in keys ) {

                createType = 'floor';

            } else if( KeyCodes.T in keys ) {

                createType = 'tube';

            } else if( KeyCodes.B in keys ) {

                createType = 'tubebend';

            } else if( KeyCodes.K in keys ) {

                createType = 'shrink';

            } else if( KeyCodes.O in keys ) {

                createType = 'grow';

            } else if( KeyCodes.P in keys ) {

                createType = 'player';

            } else if( KeyCodes.L in keys ) {

                createType = 'level';
                 
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
                createPreviewRotation: new THREE.Quaternion( 0, 0, 0, 1 ),
                creating: false,
                selecting: false
            }, update );

        }

        return copy;
        
    }

    _onAnimate() {

        const rotateable = ( KeyCodes.CTRL in this.keysPressed ) ||
            ( KeyCodes.ALT in this.keysPressed );

        if( rotateable || this.state.selecting ) {

            this.controls.enabled = true;

        } else {

            this.controls.enabled = false;

        }

        let state = {
            time: Date.now(),
            rotateable,
            lightPosition: new THREE.Vector3(
                radius * Math.sin( clock.getElapsedTime() * speed ),
                10,
                radius * Math.cos( clock.getElapsedTime() * speed )
            )
        };

        if( KeyCodes[ '[' ] in this.keysPressed ) {

            if( !this.snapChange ) {
                state.gridSnap = this.state.gridSnap / 2;
                state.gridScale = new THREE.Vector3(
                    state.gridSnap, state.gridSnap, state.gridSnap
                );
                this.snapChange = true;
            }

        } else if( KeyCodes[ ']' ] in this.keysPressed ) {

            if( !this.snapChange ) {
                state.gridSnap = this.state.gridSnap * 2;
                state.gridScale = new THREE.Vector3(
                    state.gridSnap, state.gridSnap, state.gridSnap
                );
                this.snapChange = true;
            }

        } else {

            this.snapChange = false;

        }

        let rotationChange;
        if( KeyCodes[ '1' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( 0, 90, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '2' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( 0, 90, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '3' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( -90, 0, 0 );
                this.rotateChange = true;
            }

        } else if( KeyCodes[ '4' ] in this.keysPressed ) {

            if( !this.rotateChange ) {
                rotationChange = new THREE.Vector3( 90, 0, 0 );
                this.rotateChange = true;
            }

        } else {

            this.rotateChange = false;

        }

        if( rotationChange ) {
            const { createPreviewRotation } = this.state;
            state.createPreviewRotation = createPreviewRotation
                .clone()
                .multiply( new THREE.Quaternion()
                    .setFromEuler( new THREE.Euler(
                        THREE.Math.degToRad( rotationChange.x ),
                        THREE.Math.degToRad( rotationChange.y ),
                        0
                    ) )
                );
        }

        state = this._setStateFromKey( state, this.keysPressed );

        if( this.state.selecting && ( KeyCodes.X in this.keysPressed ) && this.state.selectedObjectId ) {

            this.setState({ selectedObjectId: null });
            this.props.removeEntity(
                this.props.currentLevelId,
                this.state.selectedObjectId,
                this.props.currentLevelAllEntities[ this.state.selectedObjectId ].type
            );
            
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
        
        const {
            currentLevelId, currentLevel, nextLevelId, nextLevelEntity,
            previousLevelEntity,
        } = this.props;

        if( !currentLevelId ) {

            return;

        }

        const {
            scene, previewPosition, currentLevelStaticEntities, camera,
            dragCreateBlock, container, staticEntities
        } = this.refs;

        const { entityIds } = currentLevel;
        const bounds = container.getBoundingClientRect();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const mouse = {
            x: ( ( event.clientX - bounds.left ) / width ) * 2 - 1,
            y: -( ( event.clientY - bounds.top ) / height ) * 2 + 1
        };


        raycaster.setFromCamera( mouse, camera );

        const intersections = raycaster
            .intersectObjects( scene.children, true )
            .filter( ( intersection ) => {
                return intersection.object !== (
                        previewPosition &&
                        previewPosition.refs.mesh
                    ) &&
                    intersection.object !== (
                        previewPosition &&
                        previewPosition.refs.mesh2
                    ) &&
                    intersection.object !== dragCreateBlock &&
                    !( intersection.object instanceof THREE.Line ) &&
                    ( intersection.object.parent !== this.refs.previewGroup ) &&
                    ( intersection.object.parent && intersection.object.parent.parent !== this.refs.previewGroup );
            })
            .sort( ( a, b ) => {
                return a.distance - b.distance;
            });

        if ( this.state.selecting && intersections.length ) {

            const objectIntersection = intersections[ 0 ].object;

            let objectUnderCursorId = entityIds.find( ( id ) => {

                const ref = staticEntities.refs[ id ];
                
                return ref && ref.refs.mesh === objectIntersection;

            });

            // Did the object we clicked on appear inside our next level ref?
            // if so, set selected object to the next level entity
            if( nextLevelId &&
                    objectIntersection.parent === this.refs.nextLevel.refs.group
                ) {
                objectUnderCursorId = nextLevelEntity.id;
            }
            if( previousLevelEntity &&
                    objectIntersection.parent === this.refs.previousLevel.refs.group
                ) {
                objectUnderCursorId = previousLevelEntity.id;
            }

            this.setState({ objectUnderCursorId });

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
            ).addScalar( this.state.createType === 'level' ? 0 : -gridSnap / 2 );

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

        } else if( this.state.creating ) {

            this.setState({ createPreviewPosition: null });

        }

    }

    onMouseDown( event ) {

        const {
            gridSnap, rotateable, createPreviewPosition, creating, selecting,
            objectUnderCursorId
        } = this.state;

        if( rotateable ) {

            this.setState({
                rotating: true
            });

        } else if( selecting && objectUnderCursorId ) {

            this.setState({ selectedObjectId: objectUnderCursorId });

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
            createPreviewScale, createPreviewRotation, createMaterialId
        } = this.state;

        const { currentLevelId, levels } = this.props;

        if( rotateable ) {

            this.setState({
                rotating: false
            });

        }

        if( dragCreating ) {

            if( createType === 'level' ) {

                this.props.addNextLevel(
                    currentLevelId, this.state.insertLevelId,
                    createPreviewPosition, createPreviewScale
                );

            } else {

                this.props.addEntity(
                    currentLevelId, createType, createPreviewPosition,
                    createPreviewScale, createPreviewRotation, createMaterialId
                );

            }

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

    selectMaterialId( createMaterialId ) {

        return ( event ) => {
            event.preventDefault();
            this.setState({ createMaterialId });
        };

    }

    changeMaterialId( newMaterialId ) {

        return ( event ) => {
            event.preventDefault();
            this.props.changeEntityMaterial(
                this.state.selectedObjectId,
                newMaterialId
            );
        };

    }

    onMoveSelectedObject( field, event ) {

        const { selectedObjectId } = this.state;
        const value = parseFloat( event.target.value );

        this.props.moveEntity( selectedObjectId, field, value );

    }

    onRotateSelectedObject( field, event ) {

        const { selectedObjectId } = this.state;
        const value = parseFloat( event.target.value );

        this.props.rotateEntity( selectedObjectId, field, value );

    }

    render() {

        const {
            levels, currentLevelId, currentLevel, currentLevelAllEntities,
            currentLevelStaticEntities, nextLevelId, nextLevelEntity,
            allEntities, currentLevelAllEntitiesArray,
            currentLevelStaticEntitiesArray, nextLevelEntitiesArray,
            previousLevelEntity, previousLevelEntitiesArray
        } = this.props;

        if( !currentLevelId ) {

            return <div>
                No level selected
                <ul>
                { ( Object.keys( levels ) || [] ).map( id => {
                    return <li key={ id }>
                        <a onClick={ this.props.selectLevel.bind( null, id ) }>
                            { levels[ id ].name }
                        </a>
                    </li>;
                }) }
                </ul>
                <button onClick={ this.props.addLevel.bind( null, 'New Level' ) }>
                    Create Level
                </button>
            </div>;

        }

        const { entityIds } = currentLevel;

        const {
            createType, selecting, selectedObjectId, creating, rotateable,
            createPreviewPosition, gridScale, createPreviewRotation, gridSnap,
            rotating, time, lightPosition
        } = this.state;

        const selectedObject = allEntities[ selectedObjectId ];

        let editorState = 'None';
        if( rotateable ) {

            editorState = 'Rotating';

        } else if( creating ) {

            editorState = 'Create';

        } else if( selecting ) {

            editorState = 'Select';

        }

        let previewObject = null;

        if( !rotateable && creating && createPreviewPosition ) {

            if( createType === 'grow' ) {

                previewObject = <Grow
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            } else if( createType === 'shrink' ) {

                previewObject = <Shrink
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            } else if( createType === 'wall' ) {

                previewObject = <Wall
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            } else if( createType === 'floor' ) {

                previewObject = <Floor
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

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

            } else if( createType === 'player' ) {

                previewObject = <Player
                    position={ createPreviewPosition }
                    rotation={ createPreviewRotation }
                    materialId="ghostMaterial"
                    ref="previewPosition"
                    radius={ 0.5 }
                />;

            } else if( createType === 'level' ) {

                previewObject = <group
                    position={ createPreviewPosition }
                    quaternion={ createPreviewRotation }
                    scale={ gridScale }
                    ref="previewGroup"
                >
                    <Wall
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        ref="previewPosition"
                        materialId="ghostMaterial"
                        position={ new THREE.Vector3( 0, 1, 0 ) }
                        scale={ new THREE.Vector3( 8.01, 2.01, 8.01 ) }
                    />
                    <StaticEntities
                        time={ time }
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        entities={
                            levels[ this.state.insertLevelId ].entityIds
                                .map( id => allEntities[ id ] )
                                .filter( entity => entity.type !== 'level' )
                        }
                    />
                </group>;

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
                        rotateable,
                        rotating,
                        creating
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
                                <shape resourceId="row">
                                    <moveTo
                                        x={-width / 2}
                                        y={0}
                                    />
                                    <lineTo
                                        x={width / 2}
                                        y={0}
                                    />
                                </shape>
                                <shape resourceId="col">
                                    <moveTo
                                        x={0}
                                        y={-height / 2}
                                    />
                                    <lineTo
                                        x={0}
                                        y={height / 2}
                                    />
                                </shape>
                                <lineBasicMaterial
                                    resourceId="gridLineMaterial"
                                    color={0x222222}
                                    linewidth={0.5}
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
                                <boxGeometry
                                    resourceId="1x1box"

                                    width={1}
                                    height={1}
                                    depth={1}

                                    widthSegments={1}
                                    heightSegments={1}
                                />
                                <meshBasicMaterial
                                    resourceId="gridFloorMaterial"
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
                                    radius={ 1.0 }
                                    widthSegments={ 20 }
                                    heightSegments={ 20 }
                                />

                                <meshPhongMaterial
                                    resourceId="playerMaterial"
                                    color={ 0xfade95 }
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

                                position={ lightPosition }
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
                                    resourceId="gridFloorMaterial"
                                />
                            </mesh>

                            { this.state.dragCreating ? <mesh
                                position={ this.state.createPreviewPosition }
                                scale={ this.state.createPreviewScale }
                                ref="dragCreateBlock"
                            >
                                <geometryResource
                                    resourceId="1x1box"
                                />
                                <materialResource
                                    resourceId="ghostMaterial"
                                />
                            </mesh> : previewObject }

                            <Grid
                                position={ this.state.gridPosition }
                                rows={ 20 }
                                columns={ 20 }
                                spacing={ gridSnap }
                            />

                            <StaticEntities
                                ref="staticEntities"
                                entities={ currentLevelStaticEntitiesArray }
                                time={ time }
                            />

                            { nextLevelEntity && <StaticEntities
                                ref="nextLevel"
                                position={ nextLevelEntity.position }
                                scale={ nextLevelEntity.scale }
                                entities={ nextLevelEntitiesArray }
                                time={ time }
                            /> }

                            { previousLevelEntity && <StaticEntities
                                ref="previousLevel"
                                position={ previousLevelEntity.position }
                                scale={ previousLevelEntity.scale }
                                entities={ previousLevelEntitiesArray }
                                time={ time }
                                opacity={ 0.5 }
                            /> }

                        </scene>

                    </React3>
                </div>

                <div className={ cx({ sidebar: true }) }>
                    <b>Editor</b>
                    <br />
                    <br />
                    { selecting && selectedObjectId ? <div>
                        <b>Object Seelcted</b>
                        <br />
                        Press [X] to delete this object
                        <br />
                        <br />
                        <b>type</b>: {selectedObject.type}
                        <br />
                        <b>id</b>: {selectedObject.id}
                        <br />
                        <b>scale</b>: {selectedObject.scale.x} {selectedObject.scale.y} {selectedObject.scale.z}
                        <br />
                        <b>position</b>:
                        <br />

                        x <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.position.x }
                            onChange={ this.onMoveSelectedObject.bind( this, 'x' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        y <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.position.y }
                            onChange={ this.onMoveSelectedObject.bind( this, 'y' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        z <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.position.z }
                            onChange={ this.onMoveSelectedObject.bind( this, 'z' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        <br />
                        <b>rotation euler</b>:
                        <br />

                        x <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.rotation.x }
                            onChange={ this.onRotateSelectedObject.bind( this, 'x' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        y <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.rotation.y }
                            onChange={ this.onRotateSelectedObject.bind( this, 'y' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        z <input
                            type="number"
                            style={{ width: '40px' }}
                            value={ selectedObject.rotation.z }
                            onChange={ this.onRotateSelectedObject.bind( this, 'z' ) }
                            min={-Infinity}
                            max={Infinity}
                            step={ gridSnap }
                        />

                        <br /><br />

                        { Object.keys( Textures ).map( ( key ) => {

                            return <button onClick={ this.changeMaterialId( key ) }
                                key={ key }
                            >
                                <img
                                    src={ Textures[ key ] }
                                    height={ 20 }
                                    width={ 20 }
                                />
                            </button>;

                        })}

                        { ( selectedObject.type === 'wall' || selectedObject.type === 'floor' ) && <div>
                            <br /><br />
                            <button
                                onClick={
                                    this.props.changeEntityType.bind(
                                        null,
                                        selectedObjectId,
                                        selectedObject.type === 'wall' ? 'floor' : 'wall'
                                    )
                                }
                            >
                                Switch type to { selectedObject.type === 'wall' ? 'Floor' : 'Wall' }
                            </button>
                        </div> }

                    </div> : null }

                    { creating ? <div>
                        <b>Create</b>
                        <br />
                        [W] { createType === 'wall' && '✓' }
                        <button onClick={ this.selectType( 'wall' ) }>
                            Wall
                        </button>
                        [F] { createType === 'floor' && '✓' }
                        <button onClick={ this.selectType( 'floor' ) }>
                            Floor
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
                        <br />
                        [K] { createType === 'shrink' && '✓' }
                        <button onClick={ this.selectType( 'shrink' ) }>
                            Shrink
                        </button>
                        [O] { createType === 'grow' && '✓' }
                        <button onClick={ this.selectType( 'grow' ) }>
                            Grow
                        </button>
                        <br />
                        [P] { createType === 'player' && '✓' }
                        <button onClick={ this.selectType( 'player' ) }>
                            Player
                        </button>
                        <br />
                        [L] { createType === 'level' && '✓' }
                        <select
                            onChange={ this.onLevelCreateChange }
                            value={ this.state.insertLevelId }
                        >
                            { ( Object.keys( levels ) || [] ).map( id => {
                                return <option
                                    key={ id }
                                    value={ id }
                                >
                                    { levels[ id ].name }
                                </option>;
                            }) }
                        </select>
                        <button onClick={ this.selectType( 'level' ) }>
                            Level
                        </button>

                        { ( createType === 'wall' || createType === 'floor' ) && <div>

                            { Object.keys( Textures ).map( ( key ) => {

                                return <button
                                    onClick={ this.selectMaterialId( key ) }
                                    key={ key }
                                >
                                    <img
                                        src={ Textures[ key ] }
                                        height={ 20 }
                                        width={ 20 }
                                    />
                                </button>;

                            })}

                        </div> }

                    </div> : null }

                    <br />
                    <b>Keyboard Shortcuts</b>
                    <br />
                    <br />
                    [C] { creating && '✓' } Create entities mode.
                    <br />
                    [S] { selecting && '✓' } Select & Zoom mode. Use mouse to rotate camera and scroll to zoom.
                    <br />
                    [G] Start Game.
                    <br />
                    [Esc] Return to editor.

                    <br />
                    <b>Level Name</b>
                    <input
                        type="text"
                        value={ currentLevel.name }
                        onChange={ event => this.props.renameLevel(
                            currentLevelId, event.target.value
                        ) }
                    />
                    <div>
                        { currentLevel.saved ? <button
                            onClick={ this.props.updateLevel.bind( null, currentLevel, currentLevelAllEntities ) }
                        >
                            Update Level "{ currentLevel.name }"
                        </button> : <button
                            onClick={ this.props.saveLevel.bind( null, currentLevel, currentLevelAllEntities ) }
                        >
                            Save Level "{ currentLevel.name }"
                        </button> }
                    </div>

                </div>

            </div>

            <div>
                { nextLevelEntity && <div>
                    Next level: { nextLevelEntity.level.name }
                    <button
                        onClick={ this.props.removeNextLevel.bind(
                            null, currentLevelId, nextLevelEntity.id
                        ) }
                    >
                        Remove
                    </button>
                    <button
                        onClick={ this.props.insetLevel.bind(
                            null, currentLevelId, nextLevelId,
                            nextLevelEntity.id,
                            ( levels[ nextLevelId ].entityIds.map(
                                id => allEntities[ id ]
                            ).find( entity => entity.type === 'level' ) || {} ).id,
                            nextLevelEntity.position.clone()
                                .multiply(
                                    new THREE.Vector3( -1, 1, -1 )
                                )
                                .multiplyScalar( 1 / nextLevelEntity.scale.x )
                                .setY( -7 ),
                            new THREE.Vector3(
                                1 / nextLevelEntity.scale.x,
                                1 / nextLevelEntity.scale.y,
                                1 / nextLevelEntity.scale.z
                            )
                        ) }
                    >
                        Set to previous inset level
                    </button>
                    <br /><br />
                </div> }
                <b>State:</b> { editorState }
                <br />
                <b>Grid Snap:</b> { gridSnap }
                <br />
                <b>Levels:</b>
                <ul>
                { ( Object.keys( levels ) || [] ).map( id => {
                    return <li key={ id }>
                        <a onClick={ this.props.selectLevel.bind( null, id ) }>
                            { levels[ id ].name }
                        </a>
                    </li>;
                }) }
                </ul>
                <button onClick={ this.props.addLevel.bind( null, 'New Level' ) }>
                    Create Level
                </button>
            </div>

        </div>;
    }

}
