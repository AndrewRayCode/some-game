import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { browserHistory } from 'react-router';
import {
    rotateEntity, moveEntity, addEntity, removeEntity, changeEntityMaterial,
    createLevel, selectLevelAndChapter, deserializeLevels, renameLevel,
    addNextChapter, removeNextChapter, insetChapter, changeEntityType,
    createBook, selectBook, renameChapter, renameBook, createChapterFromLevel,
    saveAll, changeEntityWrapMaterial, changeEntityFoamMaterial,
    changeEntityTopMaterial, changeEntityProperty
} from '../../redux/modules/editor';
import { bindActionCreators } from 'redux';
import classNames from 'classnames/bind';
import styles from './Editor.scss';

import {
    EntityGroup, Grid, EditorResources, TexturePicker, CreatePreviewObject,
    Kbd, ArrayEditor
} from 'components';

import Textures from 'Textures';
import CustomShaders from 'CustomShaders';
import shaderFrog from 'helpers/shaderFrog';
import KeyCodes from 'helpers/KeyCodes';

import { areBooksLoaded, loadAllBooks } from 'redux/modules/editor';
import { areAssetsLoaded, loadAllAssets } from 'redux/modules/assets';
import { without } from 'helpers/Utils';

import UpdateAllObjects from 'helpers/UpdateAllObjects';

const cx = classNames.bind( styles );

// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';

THREE.TextureLoader.prototype.crossOrigin = '';

import OrbitControls from 'three-orbit-controls';
const OrbitControlsThree = OrbitControls( THREE );

const radius = 20;
const speed = 0.1;

const gameWidth = 400;
const gameHeight = 400;

const raycaster = new THREE.Raycaster();

function snapTo( number, interval ) {

    return interval * Math.ceil( number / interval );

}

@asyncConnect([{
    promise: ({ store: { dispatch, getState } }) => {
        const promises = [];
        if( !areBooksLoaded( getState() ) ) {
            promises.push( dispatch( loadAllBooks() ) );
        }
        return Promise.all( promises );
    }
}, {
    promise: ({ store: { dispatch, getState } }) => {
        if( !__SERVER__ && !areAssetsLoaded( getState() ) ) {
            return dispatch( loadAllAssets() );
        }
    }
}, {
    promise: ({ store: { dispatch } }) => {
        if( !__SERVER__ ) {
            return dispatch( deserializeLevels() );
        }
    }
}])
@connect(
    state => {

        const {
            levels: allLevels,
            books, assets, shaders,
            currentEditorLevel: currentLevelId,
            currentEditorBook: currentBookId,
            currentEditorChapter: currentChapterId,
            entities: allEntities,
            chapters: allChapters,
        } = state;

        let bookState = {};

        // Books and chapters
        if( currentBookId ) {

            const currentBook = books[ currentBookId ];
            const { chapterIds } = currentBook;

            const currentChapters = chapterIds.reduce(
                ( memo, id ) => ({ ...memo, [ id ]: allChapters[ id ] }),
                {}
            );

            const currentLevels = chapterIds.reduce( ( memo, id ) => {
                const { levelId } = allChapters[ id ];
                return {
                    ...memo,
                    [ levelId ]: allLevels[ levelId ]
                };
            }, {} );

            // Find the first chapter for any level, so that when we select a
            // level, we can easily look up an arbitrary chapter to go with it.
            // You can't edit/have a level without a chapter.
            const firstChapterIdsContainingLevel = chapterIds.reduce( ( memo, id ) => {

                const chapter = allChapters[ id ];
                const { levelId } = chapter;

                if( !( levelId in memo ) ) {
                    memo[ levelId ] = chapter.id;
                }

                return memo;

            }, {} );


            bookState = {
                currentBookId, currentChapters, currentBook,
                currentLevels, firstChapterIdsContainingLevel,
                currentChaptersArray: Object.values( currentChapters ),
                hasCurrentChapters: !!Object.keys( currentChapters ).length,
            };

        }

        // Levels and entities. Note a selected level implies a selected
        // chapter
        let levelState = {};

        if( currentLevelId ) {

            const currentLevel = allLevels[ currentLevelId ];

            const currentLevelStaticEntities = currentLevel.entityIds.reduce(
                ( memo, id ) => ({
                    ...memo,
                    [ id ]: allEntities[ id ]
                }),
                {}
            );

            const previousChapter = bookState.currentChaptersArray.find(
                chapter => chapter.nextChapters.some(
                    nextChapter => nextChapter.chapterId === currentChapterId
                )
            );

            let previousChapterEntities;
            let previousChapterEntity;

            const currentChapter = bookState.currentChapters[ currentChapterId ];
            const { nextChapters } = currentChapter;

            if( previousChapter ) {

                const previousChapterData = previousChapter.nextChapters.find(
                    nextChapter => nextChapter.chapterId === currentChapterId
                );

                const previousLevel = allLevels[ previousChapter.levelId ];
                previousChapterEntities = previousLevel.entityIds.map(
                    id => allEntities[ id ]
                );

                const isPreviousChapterBigger = previousChapterData.scale.x > 1;
                const multiplier = isPreviousChapterBigger ? 0.125 : 8;

                previousChapterEntity = {
                    scale: new THREE.Vector3(
                        multiplier, multiplier, multiplier
                    ),
                    position: previousChapterData.position
                        .clone()
                        .multiply(
                            new THREE.Vector3( -multiplier, multiplier, -multiplier )
                        )
                        .setY( isPreviousChapterBigger ? 0.875 : -7 )
                };

            }

            // Index all next chapter entities by chapter id
            let nextChaptersEntities;
            if( nextChapters ) {

                nextChaptersEntities = nextChapters.reduce(
                    ( memo, nextChapter ) => ({
                        ...memo,
                        [ nextChapter.chapterId ]: allLevels[
                                allChapters[ nextChapter.chapterId ].levelId
                            ].entityIds.map( id => allEntities[ id ] )
                    }),
                    {}
                );

            }

            levelState = {
                currentLevel, currentLevelId, currentLevelStaticEntities,
                allEntities, previousChapter, nextChaptersEntities,
                previousChapterEntities, previousChapterEntity, currentChapter,
                nextChapters,
                currentLevelStaticEntitiesArray: Object.values( currentLevelStaticEntities ),
            };

        }

        return {
            ...bookState,
            ...levelState,
            shaders, assets,
            books, allChapters, allLevels, currentChapterId
        };

    },
    dispatch => bindActionCreators({
        addEntity, removeEntity, moveEntity, rotateEntity,
        changeEntityMaterial, addNextChapter, renameLevel,
        createLevel, renameChapter, renameBook, removeNextChapter,
        insetChapter, changeEntityType, createBook, selectBook,
        selectLevelAndChapter, createChapterFromLevel, saveAll,
        changeEntityFoamMaterial, changeEntityWrapMaterial,
        changeEntityTopMaterial, changeEntityProperty
    }, dispatch )
)
export default class Editor extends Component {

    static contextTypes = {
        store: PropTypes.object.isRequired
    }

    constructor( props, context ) {

        super( props, context );

        this.keysPressed = {};

        const gridSnap = 1;

        this.state = {
            gridSnap,
            gridScale: new THREE.Vector3( gridSnap, gridSnap, gridSnap ),
            createMaterialId: 'ornateWall1',
            createWrapMaterialId: 'shrinkWrapMaterial',
            createFoamMaterialId: 'waterFoam',
            createType: 'wall',
            selecting: true,
            createPreviewRotation: new THREE.Quaternion( 0, 0, 0, 1 ),
            cameraPosition: new THREE.Vector3(0, 7, 0),
            cameraRotation: new THREE.Euler(0, 0, 0),
            lightPosition: new THREE.Vector3(),

            gridBasePosition: new THREE.Vector3( 0, 0, 0 ),
            gridBaseRotation: new THREE.Euler( 0, Math.PI / 2, 0 ),
            gridBaseScale: new THREE.Vector3( 200, 0.00001, 200 ),

            insertChapterId: props.hasCurrentChapters ?
                props.currentChaptersArray[ 0 ].id :
                null,
            gridPosition: new THREE.Vector3( 0, 0, 0 )
        };

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onInputFocus = this.onInputFocus.bind( this );
        this.onInputBlur = this.onInputBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this.onMouseMove = this.onMouseMove.bind( this );
        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseUp = this.onMouseUp.bind( this );
        this._onOrbitChange = this._onOrbitChange.bind( this );
        this.selectType = this.selectType.bind( this );
        this.selectMaterialId = this.selectMaterialId.bind( this );
        this.changeWrapMaterialId = this.changeWrapMaterialId.bind( this );
        this.changeTopMaterialId = this.changeTopMaterialId.bind( this );
        this.changeFoamMaterialId = this.changeFoamMaterialId.bind( this );
        this.changeMaterialId = this.changeMaterialId.bind( this );
        this.onChapterCreateChange = this.onChapterCreateChange.bind( this );
        this.onPropertyChangeBindPass = this.onPropertyChangeBindPass.bind( this );
        this.onPropertyChange = this.onPropertyChange.bind( this );
        this.onPropertyChangeNumber = this.onPropertyChangeNumber.bind( this );
        this.deselectAll = this.deselectAll.bind( this );
        this.createLevel = this.createLevel.bind( this );
        this.selectLevelAndChapter = this.selectLevelAndChapter.bind( this );
        this.createChapterFromLevel = this.createChapterFromLevel.bind( this );

    }

    componentDidMount() {

        if( !__SERVER__ ) {

            window.THREE = THREE;

            window.addEventListener( 'keydown', this.onKeyDown );
            window.addEventListener( 'keyup', this.onKeyUp );

            this._setUpOrbitControls();

            window.addEventListener( 'blur', this.onWindowBlur );
            window.addEventListener( 'focusin', this.onInputFocus );
            window.addEventListener( 'focusout', this.onInputBlur );

        }

    }

    componentWillUnmount() {

        if( typeof window !== 'undefined' ) {

            window.removeEventListener( 'keydown', this.onKeyDown );
            window.removeEventListener( 'keyup', this.onKeyUp );

            window.removeEventListener( 'blur', this.onWindowBlur );
            window.removeEventListener( 'focusin', this.onInputFocus );
            window.removeEventListener( 'focusout', this.onInputBlur );

            if( this.controls ) {
                this.controls.removeEventListener('change', this._onOrbitChange);
            }

        }

    }

    componentDidUpdate() {

        this._setUpOrbitControls();

    }

    onWindowBlur() {

        this.keysPressed = {};

    }

    onInputBlur() {

        if( this.focused ) {

            this.focused = false;
            this.setState({ focused: false });
            window.addEventListener( 'keyup', this.onKeyUp );
            window.addEventListener( 'keydown', this.onKeyDown );

        }

    }

    onInputFocus( event ) {

        if( event.target.tagName === 'INPUT' ) {

            this.keysPressed = {};
            this.focused = true;
            this.setState({ focused: true });
            window.removeEventListener( 'keyup', this.onKeyUp );
            window.removeEventListener( 'keydown', this.onKeyDown );

        }

    }

    onChapterCreateChange( event ) {

        this.setState({
            insertChapterId: event.target.value
        });

    }

    onPropertyChangeBindPass( id, property, newValue ) {

        return () => {

            this.props.changeEntityProperty(
                id,
                property,
                newValue
            );

        };

    }

    onPropertyChange( id, property, event ) {

        this.props.changeEntityProperty(
            id,
            property,
            event.target ?
                ( 'checked' in event.target ?
                    event.target.checked :
                    event.target.value
                ) : event
        );

    }

    onPropertyChangeNumber( id, property, event ) {

        this.props.changeEntityProperty( id, property, parseFloat( event.target ? event.target.value : event ) );

    }

    _setUpOrbitControls() {

        const {
            container,
            camera,
        } = this.refs;

        if( ( camera && container ) &&
                 ( camera !== this.currentCamera ||
                    container !== this.currentContainer )
            ) {

            if( this.controls ) {

                this.controls.removeEventListener( 'change', this._onOrbitChange );

            }

            const controls = new OrbitControlsThree( camera, container );

            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.enableZoom = true;
            controls.enablePan = true;
            controls.enableDamping = true;
            controls.dampingFactor = 0.3;
            controls.addEventListener( 'change', this._onOrbitChange );

            this.controls = controls;
            this.currentCamera = camera;
            this.currentContainer = container;

        }

    }

    componentWillReceiveProps( nextProps ) {

        // Get the selected level id if levels weren't available on first mount
        if( nextProps.hasCurrentChapters && !this.state.insertChapterId ) {
            this.setState({
                insertChapterId: nextProps.currentChaptersArray[ 0 ].id
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

            } else if( KeyCodes.P in keys ) {

                createType = 'chamferbox';

            } else if( KeyCodes.F in keys ) {

                createType = 'multiwall';

            } else if( KeyCodes.T in keys ) {

                createType = 'tube';

            } else if( KeyCodes.B in keys ) {

                createType = 'tubebend';

            } else if( KeyCodes.K in keys ) {

                createType = 'shrink';

            } else if( KeyCodes.O in keys ) {

                createType = 'grow';

            } else if( KeyCodes.A in keys ) {

                createType = 'player';

            } else if( KeyCodes.H in keys ) {

                createType = 'finish';

            } else if( KeyCodes.L in keys ) {

                createType = 'chapter';
                 
            }

            if( createType ) {

                copy = {
                    ...copy,
                    createType
                };

            }

        }

        if( KeyCodes.G in keys ) {

            browserHistory.push( '/game' );

        }

        if( stateKey ) {

            const update = { [ stateKey ]: true };
            copy = {
                ...copy,
                createPreviewRotation: new THREE.Quaternion( 0, 0, 0, 1 ),
                creating: false,
                selecting: false,
                ...update
            };

        }

        return copy;
        
    }

    _onAnimate( elapsedTime, delta ) {

        const rotateable = ( KeyCodes.CTRL in this.keysPressed ) ||
            ( KeyCodes.ALT in this.keysPressed );

        if( rotateable || this.state.selecting ) {

            this.controls.enabled = true;

        } else {

            this.controls.enabled = false;

        }

        let state = {
            time: elapsedTime,
            delta,
            rotateable,
            lightPosition: new THREE.Vector3(
                radius * Math.sin( elapsedTime * speed ),
                10,
                radius * Math.cos( elapsedTime * speed )
            )
        };

        shaderFrog.updateShaders( elapsedTime );

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

        const { selecting, selectedObjectId, } = this.state;

        if( selecting && ( KeyCodes.X in this.keysPressed ) &&
                selectedObjectId &&
                // levels are special case
                this.props.currentLevelStaticEntities[ selectedObjectId ].type !== 'level'
                ) {

            this.setState({
                selectedObjectId: null,
                selectedObject: null
            });
            this.props.removeEntity(
                this.props.currentLevelId,
                selectedObjectId,
                this.props.currentLevelStaticEntities[ selectedObjectId ].type
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

        this.keysPressed = {
            ...this.keysPressed,
            [ which ]: true
        };

    }

    onKeyUp( event ) {

        const { which } = event;
        this.keysPressed = without( this.keysPressed, which );

    }

    onMouseMove( event ) {
        
        const { currentLevelId, currentLevel, nextChapters, } = this.props;

        if( !currentLevelId ) {

            return;

        }

        const {
            scene, previewComponent, camera, dragCreateBlock, container,
            staticEntities,
        } = this.refs;

        const { previewPosition, previewGroup } = ( previewComponent || {} ).refs || {};
        const { entityIds } = currentLevel;
        const bounds = container.getBoundingClientRect();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const mouse = {
            x: ( ( event.clientX - bounds.left ) / gameWidth ) * 2 - 1,
            y: -( ( event.clientY - bounds.top ) / gameHeight ) * 2 + 1
        };

        raycaster.setFromCamera( mouse, camera );

        const intersections = raycaster
            .intersectObjects( scene.children, true )
            .filter( intersection => {
                return intersection.object !== (
                        previewPosition && previewPosition.refs.mesh
                    ) &&
                    intersection.object !== (
                        previewPosition && previewPosition.refs.mesh2
                    ) &&
                    intersection.object !== (
                        previewPosition && previewPosition.refs.child && previewPosition.refs.child.refs.mesh
                    ) &&
                    intersection.object !== dragCreateBlock &&
                    !( intersection.object instanceof THREE.Line ) &&
                    ( !previewGroup || (
                        ( intersection.object.parent !== previewGroup ) &&
                        ( intersection.object.parent && intersection.object.parent.parent !== previewGroup ) &&
                        ( intersection.object.parent.parent && intersection.object.parent.parent.parent !== previewGroup )
                    ) );
            })
            .sort( ( a, b ) => {
                return a.distance - b.distance;
            });

        if( this.state.selecting && intersections.length ) {

            const objectIntersection = intersections[ 0 ].object;

            const objectUnderCursorId = entityIds.find( id => {

                const ref = staticEntities.refs[ id ];
                
                return ref && ref.refs && (
                    ( ref.refs.mesh === objectIntersection ) ||
                    ( ref.refs.mesh === objectIntersection.parent ) ||
                    ( ref.refs.mesh === objectIntersection.parent.parent ) ||
                    ( ref.refs.mesh2 === objectIntersection ) ||
                    ( ref.refs.mesh2 === objectIntersection.parent ) ||
                    ( ref.refs.mesh2 === objectIntersection.parent.parent ) ||
                    ( ref.refs.child && ref.refs.child.refs.mesh === objectIntersection ) ||
                    ( ref.refs.child && ref.refs.child.refs.mesh === objectIntersection.parent ) ||
                    ( ref.refs.child && ref.refs.child.refs.mesh === objectIntersection.parent.parent )
                );

            });

            // Did the object we clicked on appear inside our next level ref?
            // if so, set selected object to the next level entity
            const nextChapterUnderCursor = nextChapters.find( nextChapter =>
                objectIntersection.parent === this.refs[ `nextChapter${ nextChapter.id }` ].refs.group ||
                ( objectIntersection.parent && objectIntersection.parent.parent === this.refs[ `nextChapter${ nextChapter.id }` ].refs.group ) ||
                ( objectIntersection.parent.parent && objectIntersection.parent.parent.parent === this.refs[ `nextChapter${ nextChapter.id }` ].refs.group )
            );

            // TODO
            //if( previousChapter &&
                    //objectIntersection.parent === this.refs.previousLevel.refs.group
                //) {
                //objectUnderCursorId = previousChapterEntity.id;
            //}
            
            if( nextChapterUnderCursor ) {

                this.setState({ nextChapterUnderCursor, objectUnderCursorId: null });

            } else {

                this.setState({ nextChapterUnderCursor: null, objectUnderCursorId });
                
            }

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
            ).addScalar( this.state.createType === 'chapter' ? 0 : -gridSnap / 2 );

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
            objectUnderCursorId, nextChapterUnderCursor
        } = this.state;

        if( rotateable ) {

            this.setState({
                rotating: true
            });

        } else if( selecting && objectUnderCursorId ) {

            this.setState({
                selectedObjectId: objectUnderCursorId,
                selectedNextChapter: null
            });

        } else if( selecting && nextChapterUnderCursor ) {

            this.setState({
                selectedObjectId: null,
                selectedNextChapter: nextChapterUnderCursor
            });

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

    onMouseUp() {

        const {
            rotateable, dragCreating, createType, createPreviewPosition,
            createPreviewScale, createPreviewRotation, createMaterialId,
        } = this.state;

        const { currentLevelId, currentChapterId, } = this.props;

        if( rotateable ) {

            this.setState({
                rotating: false
            });

        }

        if( dragCreating ) {

            if( createType === 'chapter' ) {

                this.props.addNextChapter(
                    currentChapterId, this.state.insertChapterId,
                    createPreviewPosition, createPreviewScale
                );

            } else {

                let entityData = {};

                if( createType === 'bridge' ) {

                    entityData = {
                        segments: 4,
                        paddingPercent: 0.1,
                        maxForce: 500000,
                        ropeMaterialId: 'brownStuco'
                    };

                } else if( createType === 'puffer' ) {

                    entityData = {
                        maxLength: 2,
                        velocity: 2,
                        angle: [ -Math.PI, Math.PI ],
                        angleSpread: Math.PI / 2,
                        opacity: [ 0.1, 0 ],
                        colors: [
                            0xffffff,
                            0xdddddd,
                        ]
                    };

                } else if( createType === 'curvedwall' ) {

                    entityData = {
                        topMaterialId: 'brownStuco'
                    };

                } else if( createType === 'waterfall' ) {

                    entityData = {
                        maxLength: 2,
                        velocity: 2,
                        angle: [ -Math.PI, Math.PI ],
                        angleSpread: Math.PI / 2,
                        opacity: [ 0.1, 0 ],
                        materialId: 'regularWater',
                        foamMaterialId: 'waterFoam'
                    };

                } else if( createType === 'shrink' ) {

                    entityData = {
                        wrapMaterialId: 'shrinkColors',
                    };

                } else if( createType === 'grow' ) {

                    entityData = {
                        wrapMaterialId: 'growColors',
                    };

                }

                this.props.addEntity(
                    currentLevelId, createType, createPreviewPosition,
                    createPreviewScale, createPreviewRotation, createMaterialId,
                    entityData
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

    changeWrapMaterialId( newWrapMaterialId ) {

        return ( event ) => {
            event.preventDefault();
            this.props.changeEntityWrapMaterial(
                this.state.selectedObjectId,
                newWrapMaterialId
            );
        };

    }
    
    changeTopMaterialId( newTopMaterialId ) {

        return ( event ) => {
            event.preventDefault();
            this.props.changeEntityTopMaterial(
                this.state.selectedObjectId,
                newTopMaterialId
            );
        };

    }

    changeFoamMaterialId( newFoamMaterialId ) {

        return ( event ) => {
            event.preventDefault();
            this.props.changeEntityFoamMaterial(
                this.state.selectedObjectId,
                newFoamMaterialId
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

    deselectAll() {
        this.setState({
            selectedObject: null,
            selectedObjectId: null
        });
    }

    createLevel( title, bookId ) {
        this.deselectAll();
        this.props.createLevel( title, bookId );
    }

    selectLevelAndChapter( levelId, id ) {
        this.deselectAll();
        this.props.selectLevelAndChapter( levelId, id );
    }

    createChapterFromLevel( name, currentLevelId, currentBookId ) {
        this.deselectAll();
        this.props.createChapterFromLevel( name, currentLevelId, currentBookId );
    }

    render() {

        const {
            books, currentLevels, currentLevelId, currentLevel,
            currentBook, currentLevelStaticEntities, shaders, assets,
            allEntities, currentLevelStaticEntitiesArray,
            currentBookId, nextChaptersEntities,
            currentChapters, currentChapterId, currentChapter,
            firstChapterIdsContainingLevel, previousChapterEntities,
            previousChapterEntity, previousChapter, nextChapters, allChapters,
        } = this.props;

        const {
            createType, selecting, selectedObjectId, creating, rotateable,
            createPreviewPosition, gridScale, createPreviewRotation, gridSnap,
            rotating, time, lightPosition, selectedNextChapter,
            createMaterialId, insertChapterId, dragCreating,
        } = this.state;

        if( !currentBookId ) {

            return <div>
                No book selected
                <ul>
                { ( Object.keys( books ) || [] ).map( id => {
                    return <li key={ id }>
                        <a onClick={ this.props.selectBook.bind( null, id ) }>
                            { books[ id ].name }
                        </a>
                    </li>;
                }) }
                </ul>
                <button onClick={ this.props.createBook.bind( null, 'New Book' ) }>
                    Create Book
                </button>
            </div>;

        }

        if( !currentLevelId ) {

            return <div>
                No level selected
                <ul>
                { ( Object.keys( currentLevels ) || [] ).map( id => {
                    return <li key={ id }>
                        <a onClick={ this.selectLevelAndChapter.bind( null, id, firstChapterIdsContainingLevel[ id ] ) }>
                            { currentLevels[ id ].name }
                        </a>
                    </li>;
                }) }
                </ul>
                <button onClick={ this.createLevel.bind( null, 'New Level', currentBookId ) }>
                    Create Level and Corresponding Chapter
                </button>
            </div>;

        }

        const selectedObject = allEntities[ selectedObjectId ] ||
            selectedNextChapter;

        let editorState = 'None';
        if( rotateable ) {

            editorState = 'Rotating';

        } else if( creating ) {

            editorState = 'Create';

        } else if( selecting ) {

            editorState = 'Select';

        }

        let previewObject = null;

        if( !dragCreating && !rotateable && creating && createType &&
                createPreviewPosition
            ) {

            previewObject = <CreatePreviewObject
                ref="previewComponent"
                createType={ createType }
                scale={ gridScale }
                createPreviewRotation={ createPreviewRotation }
                createPreviewPosition={ createPreviewPosition }
                time={ time }
                shaders={ shaders }
                assets={ assets }
                entities={ insertChapterId ?
                    currentLevels[ currentChapters[ insertChapterId ].levelId ].entityIds
                        .map( id => allEntities[ id ] ) :
                    null
                }
            />;

        }

        return <div className="clearfix">
            <div className={ styles.editor }>
                <div
                    onMouseMove={ this.onMouseMove }
                    onMouseDown={ this.onMouseDown }
                    onMouseUp={ this.onMouseUp }
                    style={{ width: gameWidth, height: gameHeight }}
                    className={ cx({ rotateable, rotating, creating }) }
                    ref="container"
                >
                    <React3
                        mainCamera="camera"
                        width={ gameWidth }
                        height={ gameHeight }
                    >

                        <module
                            descriptor={ UpdateAllObjects }
                        />

                        <scene
                            onUpdate={ this._onAnimate }
                            ref="scene"
                        >

                            <EditorResources
                                store={ this.context.store }
                            />

                            <perspectiveCamera
                                name="camera"
                                fov={75}
                                aspect={ gameWidth / gameHeight }
                                near={0.1}
                                far={1000}
                                position={this.state.cameraPosition}
                                rotation={this.state.cameraRotation}
                                ref="camera"
                            />

                            <ambientLight
                                color={ 0x777777 }
                            />

                            <directionalLight
                                color={ 0xffffff }
                                intensity={ 1.0 }
                                castShadow
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

                            { selectedObject && <mesh
                                ref="grid"
                                position={ selectedObject.position }
                                scale={ selectedObject.scale.clone().multiplyScalar(
                                    selectedNextChapter ? 8.001 : 1.001
                                ) }
                            >
                                <geometryResource
                                    resourceId="1x1box"
                                />
                                <materialResource
                                    resourceId="selectionWireframe"
                                />
                            </mesh> }

                            { dragCreating ? <mesh
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
                            </mesh> : null }
                                
                            { previewObject }

                            <Grid
                                position={ this.state.gridPosition }
                                rows={ 20 }
                                columns={ 20 }
                                spacing={ gridSnap }
                            />

                            <EntityGroup
                                ref="staticEntities"
                                shaders={ shaders }
                                assets={ assets }
                                entities={ currentLevelStaticEntitiesArray }
                                time={ time }
                            />

                            { nextChapters.map( nextChapter => <EntityGroup
                                key={ nextChapter.id }
                                ref={ `nextChapter${ nextChapter.id }` }
                                shaders={ shaders }
                                assets={ assets }
                                position={ nextChapter.position }
                                scale={ nextChapter.scale }
                                entities={ nextChaptersEntities[ nextChapter.chapterId ] }
                                time={ time }
                            /> )}

                            { previousChapter && <EntityGroup
                                ref="previousLevel"
                                position={ previousChapterEntity.position }
                                shaders={ shaders }
                                assets={ assets }
                                scale={ previousChapterEntity.scale }
                                entities={ previousChapterEntities }
                                time={ time }
                                opacity={ 0.5 }
                            /> }

                        </scene>

                    </React3>
                </div>

                <div className={ styles.canvasData }>

                    { nextChapters.length ? <div>
                        <b>Next chapters:</b>
                        <ul>
                        { nextChapters.map( nextChapter => {

                            const chapter = allChapters[ nextChapter.chapterId ];
                            return <li
                                key={ nextChapter.id }
                                style={ nextChapter === selectedNextChapter ? {
                                    border: 'inset 1px blue'
                                } : null }
                            >
                                { chapter.name }
                                <br />
                                <button
                                    onClick={ () => this.props.removeNextChapter(
                                        currentChapter.id, nextChapter.id
                                    ) }
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={ () => this.props.insetChapter(
                                        //currentLevelId, data.level.id,
                                        //data.entity.id,
                                        //previousChapterEntity.id,
                                        //data.entity.position.clone()
                                            //.multiply(
                                                //new THREE.Vector3( -1, 1, -1 )
                                            //)
                                            //.multiplyScalar( 1 / data.entity.scale.x )
                                            //.setY( -7 ),
                                        //new THREE.Vector3(
                                            //1 / data.entity.scale.x,
                                            //1 / data.entity.scale.y,
                                            //1 / data.entity.scale.z
                                        //)
                                    ) }
                                >
                                    Set to previous inset level
                                </button>
                            </li>;

                        }) }
                        </ul>

                    </div> : null }

                    <b>State:</b> { editorState }
                    <br />
                    <b>Grid Snap:</b> { gridSnap }
                    <br />
                    <b>Levels in "{ currentBook.name }":</b>
                    <ul>
                    { ( Object.keys( currentLevels ) || [] ).map( id => {
                        const { name } = currentLevels[ id ];
                        return <li key={ id }>
                            { id === currentLevelId ?
                                <b>{ name }</b> :
                                <a onClick={ this.selectLevelAndChapter.bind( null, id, firstChapterIdsContainingLevel[ id ] ) }>
                                    { name }
                                </a>
                            }
                        </li>;
                    }) }
                    </ul>
                    <button onClick={ this.createLevel.bind( null, 'New Level', currentBookId ) }>
                        Create Level
                    </button>

                    <br /><br />
                    { currentChapters && <div>
                        <b>Chapters in "{ currentBook.name }":</b>
                        <ul>
                        { ( Object.keys( currentChapters ) || [] ).map( id => {
                            const chapter = currentChapters[ id ];
                            const { name } = chapter;
                            return <li key={ id }>
                                { id === currentChapterId ?
                                    <b>{ name }</b> :
                                    <a onClick={ this.selectLevelAndChapter.bind( null, chapter.levelId, id ) }>
                                        { name }
                                    </a>
                                }
                            </li>;
                        }) }
                        </ul>
                        <button onClick={ this.createChapterFromLevel.bind( null, currentLevel.name, currentLevelId, currentBookId ) }>
                            Create New Chapter From Level
                        </button>
                    </div> }

                    <br /><br />
                    <b>Books:</b>
                    <ul>
                    { ( Object.keys( books ) || [] ).map( id => {
                        const { name } = books[ id ];
                        return <li key={ id }>
                            { id === currentBookId ?
                                <b>{ name }</b> :
                                <a onClick={ this.props.selectBook.bind( null, id ) }>
                                    { name }
                                </a>
                            }
                        </li>;
                    }) }
                    </ul>
                    <button onClick={ this.props.createBook.bind( null, 'New Book' ) }>
                        Create Book
                    </button>

                </div>

            </div>

            <div className={ styles.sidebar }>
                <button
                    onClick={
                        this.props.saveAll.bind(
                            null, currentLevel, currentLevelStaticEntities,
                            currentBook, currentChapters
                        )
                    }
                >
                    Save Level and Book
                </button>

                <br />
                { selecting && selectedObject ? <div>
                    <b>Object Selcted</b>
                    <br />
                    Press <Kbd>X</Kbd> to delete this object
                    <br />
                    <br />
                    <b>type:</b> { selectedNextChapter ? 'nextChapter' : selectedObject.type }
                    <br />
                    <b>id:</b> { selectedObjectId }
                    <br />
                    <b>scale:</b> { selectedObject.scale.x } { selectedObject.scale.y } { selectedObject.scale.z }
                    <br />
                    <b>position:</b>
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
                    <b>rotation quaternion</b>:
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

                    w <input
                        type="number"
                        style={{ width: '40px' }}
                        value={ selectedObject.rotation.w }
                        onChange={ this.onRotateSelectedObject.bind( this, 'w' ) }
                        min={-Infinity}
                        max={Infinity}
                        step={ gridSnap }
                    />

                    <br />
                    <label>
                        Collision?

                        <input
                            type="checkbox"
                            checked={ ( 'touchable' in selectedObject ) ?
                                selectedObject.touchable :
                                true
                            }
                            onChange={ this.onPropertyChange.bind( this, selectedObjectId, 'touchable' ) }
                        />
                    </label>

                    <br />
                    <label>
                        Movable?

                        <input
                            type="checkbox"
                            checked={ selectedObject.movable }
                            onChange={ this.onPropertyChange.bind( this, selectedObjectId, 'movable' ) }
                        />
                    </label>

                    { ( selectedObject.type === 'puffer' ||
                            selectedObject.type === 'waterfall' ) ? <div>
                        <b>Impulse:</b>
                        <input
                            value={ selectedObject.impulse }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'impulse' ) }
                        />
                        <br />
                        <b>Max Length:</b>
                        <input
                            value={ selectedObject.maxLength }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'maxLength' ) }
                        />
                        <br />
                        <b>Velocity:</b>
                        <input
                            value={ selectedObject.velocity }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'velocity' ) }
                        />
                        <br />
                        <b>Colors:</b>
                        <ArrayEditor
                            value={ selectedObject.colors || [] }
                            onChange={ this.onPropertyChange.bind( null, selectedObjectId, 'colors' ) }
                        />
                        <br />
                        <b>Opacity:</b>
                        <ArrayEditor
                            value={ selectedObject.opacity || [] }
                            onChange={ this.onPropertyChange.bind( null, selectedObjectId, 'opacity' ) }
                        />
                        <br />
                        <b>Angle:</b>
                        <ArrayEditor
                            value={ selectedObject.angle || [] }
                            onChange={ this.onPropertyChange.bind( null, selectedObjectId, 'angle' ) }
                        />
                        <br />
                        <b>angleSpread:</b>
                        <input
                            value={ selectedObject.angleSpread }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'angleSpread' ) }
                        />
                    </div> : null }

                    { ( selectedObject.type === 'bridge' ) ? <div>
                        <b>Segments:</b>
                        <input
                            value={ selectedObject.segments }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'segments' ) }
                        />
                        <br />
                        <b>paddingPercent:</b>
                        <input
                            value={ selectedObject.paddingPercent }
                            onChange={ this.onPropertyChangeNumber.bind( null, selectedObjectId, 'paddingPercent' ) }
                        />
                        <br />
                    </div> : null }

                    { ( selectedObject.type === 'wall' ||
                            selectedObject.type === 'curvedwall' ||
                            selectedObject.type === 'diamondbox' ||
                            selectedObject.type === 'floor' ||
                            selectedObject.type === 'multiwall' ||
                            selectedObject.type === 'chamferbox' ||
                            selectedObject.type === 'puffer' ||
                            selectedObject.type === 'bridge' ||
                            selectedObject.type === 'waterfall' ) ? <div>
                        <br />
                        <br />
                        <b>Change materialId of Selection:</b>
                        <br />

                        <TexturePicker
                            onSelect={ this.changeMaterialId }
                            selectedId={ ( currentLevelStaticEntities[
                                selectedObjectId
                            ] || {} ).materialId }
                            shaders={ shaders }
                            textures={ Textures }
                        />
                    </div> : null }

                    { selectedObject.type === 'bridge' ? <div>
                        <br />
                        <b>Change ropeMaterialId of Selection:</b>
                        <br />

                        <TexturePicker
                            onSelect={ this.onPropertyChangeBindPass.bind( null, selectedObjectId, 'ropeMaterialId' ) }
                            selectedId={ ( currentLevelStaticEntities[
                                selectedObjectId
                            ] || {} ).ropeMaterialId }
                            shaders={ shaders }
                            textures={ Textures }
                        />
                    </div> : null }

                    { selectedObject.type === 'waterfall' ? <div>
                        <br />
                        <b>Change foamMaterialId of Selection:</b>
                        <br />

                        <TexturePicker
                            onSelect={ this.changeFoamMaterialId }
                            selectedId={ ( currentLevelStaticEntities[
                                selectedObjectId
                            ] || {} ).foamMaterialId }
                            shaders={ shaders }
                            textures={ Textures }
                        />
                    </div> : null }

                    { ( selectedObject.type === 'grow' || selectedObject.type === 'shrink' ) ? <div>
                        <br />
                        <b>Change wrapMaterialId of Selection:</b>
                        <br />

                        <TexturePicker
                            onSelect={ this.changeWrapMaterialId }
                            selectedId={ ( currentLevelStaticEntities[
                                selectedObjectId
                            ] || {} ).wrapMaterialId }
                            shaders={ shaders }
                            textures={ Textures }
                        />
                    </div> : null }

                    { ( selectedObject.type === 'multiwall' ||
                        selectedObject.type === 'floor' ||
                        selectedObject.type === 'curvedwall'
                    ) ? <div>
                        <br />
                        <b>Change topMaterialId of Selection:</b>
                        <br />

                        <TexturePicker
                            onSelect={ this.changeTopMaterialId }
                            selectedId={ ( currentLevelStaticEntities[
                                selectedObjectId
                            ] || {} ).topMaterialId }
                            shaders={ shaders }
                            textures={ Textures }
                        />
                    </div> : null }

                    { ( selectedObject.type === 'wall' ||
                            selectedObject.type === 'multiwall' ||
                            selectedObject.type === 'floor' ) ? <div>
                        <br /><br />
                        <button
                            onClick={
                                this.props.changeEntityType.bind(
                                    null,
                                    selectedObjectId,
                                    selectedObject.type === 'wall' ? 'multiwall' : 'wall'
                                )
                            }
                        >
                            Switch type to { selectedObject.type === 'wall' ? 'MultiWall' : 'Wall' }
                        </button>
                    </div> : null }

                </div> : null }

                { creating ? <div>
                    <b>Create</b>
                    <br />
                    <button onClick={ this.selectType( 'wall' ) }>
                        { createType === 'wall' && '✓' }
                        <Kbd>W</Kbd>all
                    </button>
                    <button onClick={ this.selectType( 'multiwall' ) }>
                        { createType === 'multiwall' && '✓' }
                        MultiWall <Kbd>F</Kbd>
                    </button>
                    <button onClick={ this.selectType( 'chamferbox' ) }>
                        { createType === 'chamferbox' && '✓' }
                        Chamfer Box <Kbd>P</Kbd>
                    </button>
                    <button onClick={ this.selectType( 'tube' ) }>
                        { createType === 'tube' && '✓' }
                        <Kbd>T</Kbd>ube Straight
                    </button>
                    <button onClick={ this.selectType( 'tubebend' ) }>
                        { createType === 'tubebend' && '✓' }
                        Tube <Kbd>B</Kbd>end
                    </button>
                    <button onClick={ this.selectType( 'shrink' ) }>
                        { createType === 'shrink' && '✓' }
                        Shrin<Kbd>k</Kbd>
                    </button>
                    <button onClick={ this.selectType( 'grow' ) }>
                        { createType === 'grow' && '✓' }
                        Gr<Kbd>o</Kbd>w
                    </button>
                    <button onClick={ this.selectType( 'player' ) }>
                        { createType === 'player' && '✓' }
                        Pl<Kbd>a</Kbd>yer
                    </button>
                    <button onClick={ this.selectType( 'finish' ) }>
                        { createType === 'finish' && '✓' }
                        Finis<Kbd>h</Kbd>
                    </button>

                    <br />
                    <b>Extras</b>
                    <br />
                    <button onClick={ this.selectType( 'curvedwall' ) }>
                        { createType === 'curvedwall' && '✓' }
                        Curved Wall
                    </button>
                    <button onClick={ this.selectType( 'diamondbox' ) }>
                        { createType === 'diamondbox' && '✓' }
                        Diamond Box
                    </button>
                    <button onClick={ this.selectType( 'house' ) }>
                        { createType === 'house' && '✓' }
                        House
                    </button>
                    <button onClick={ this.selectType( 'waterfall' ) }>
                        { createType === 'waterfall' && '✓' }
                        Waterfall
                    </button>
                    <button onClick={ this.selectType( 'puffer' ) }>
                        { createType === 'puffer' && '✓' }
                        Puffer
                    </button>
                    <button onClick={ this.selectType( 'bridge' ) }>
                        { createType === 'bridge' && '✓' }
                        Bridge
                    </button>
                    <select
                        onChange={ this.onChapterCreateChange }
                        value={ this.state.insertChapterId }
                    >
                        { ( Object.keys( currentChapters ) || [] ).map( id => {
                            return <option
                                key={ id }
                                value={ id }
                            >
                                { currentChapters[ id ].name }
                            </option>;
                        }) }
                    </select>
                    <button onClick={ this.selectType( 'chapter' ) }>
                        { createType === 'chapter' && '✓' }
                        Chapter
                    </button>

                    <div>
                        <b>Main Material Type</b>
                        <br />
                        <TexturePicker
                            shaders={ CustomShaders }
                            textures={ Textures }
                            selectedId={ createMaterialId }
                            onSelect={ this.selectMaterialId }
                        />
                    </div>

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
                <b>Book Name</b>
                <input
                    type="text"
                    value={ currentBook.name }
                    onChange={ event => this.props.renameBook(
                        currentBookId, event.target.value
                    ) }
                />

                <br />
                <b>Level Name</b>
                <input
                    type="text"
                    value={ currentLevel.name }
                    onChange={ event => this.props.renameLevel(
                        currentLevelId, event.target.value
                    ) }
                />

                <br />
                <b>Chapter Name</b>
                <input
                    type="text"
                    value={ currentChapter.name }
                    onChange={ event => this.props.renameChapter(
                        currentChapterId, event.target.value
                    ) }
                />

                <br />
                <br />
                <small>
                    { this.state.focused ? 'focused' : 'not focused' }
                </small>

            </div>

        </div>;
    }

}
