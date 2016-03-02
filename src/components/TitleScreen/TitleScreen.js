import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { browserHistory } from 'react-router';
import KeyCodes from '../../helpers/KeyCodes';
import shaderFrog from '../../helpers/shaderFrog';
import { without } from '../../helpers/Utils';
import styles from '../../containers/Game/Game.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind( styles );
const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );
const raycaster = new THREE.Raycaster();

const fontRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 )
);

export default class TitleScreen extends Component {
    
    static propTypes = {
        books: React.PropTypes.array.isRequired,
        fonts: React.PropTypes.object.isRequired,
        onSelect: React.PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        this.state = {
            hoveredBook: null,
        };

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this.onMouseMove = this.onMouseMove.bind( this );
        this.onMouseDown = this.onMouseDown.bind( this );

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

    }

    _onAnimate() {

        const now = Date.now();
        const { keysDown } = this;
        shaderFrog.updateShaders( Date.now() * 0.000001 );

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

    onMouseMove( event ) {
        
        const { books } = this.props;
        const { scene, camera, container } = this.refs;
        const bounds = container.getBoundingClientRect();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const mouse = {
            x: ( ( event.clientX - bounds.left ) / gameWidth ) * 2 - 1,
            y: -( ( event.clientY - bounds.top ) / gameHeight ) * 2 + 1
        };

        raycaster.setFromCamera( mouse, camera );

        const intersections = raycaster
            .intersectObjects( scene.children, true );

        let hoveredBook = null;
        if( intersections.length ) {

            const objectIntersection = intersections[ 0 ].object;

            hoveredBook = Object.values( books ).find( book => {

                return objectIntersection === this.refs[ `book${ book.id }` ];

            });

        }

        this.setState({ hoveredBook });

    }

    onMouseDown( event ) {

        const {
            hoveredBook
        } = this.state;

        if( hoveredBook ) {

            this.props.onSelect( hoveredBook );

        }

    }

    render() {

        const { books, fonts } = this.props;
        const { hoveredBook } = this.state;
                    
        if( !Object.keys( fonts ).length ) {
            return <div />;
        }
            
        return <div
            onMouseMove={ this.onMouseMove }
            onMouseDown={ this.onMouseDown }
            style={{ width: gameWidth, height: gameHeight }}
            className={ cx({ hovered: hoveredBook }) }
            ref="container"
        >
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
                        lookAt={ lookAt }
                        ref="camera"
                    />

                    <resources>
                        <textGeometry
                            resourceId="title"
                            size={ 0.6 }
                            height={ 0.2 }
                            bevelEnabled
                            bevelThickness={ 0.02 }
                            bevelSize={ 0.01 }
                            font={ fonts[ 'Sniglet Regular' ] }
                            text="Today I'm A Galaxy"
                        />
                        { books.map( book =>
                            <textGeometry
                                key={ book.id }
                                resourceId={ book.name }
                                size={ 0.8 }
                                height={ 0.2 }
                                bevelEnabled
                                bevelThickness={ 0.02 }
                                bevelSize={ 0.01 }
                                font={ fonts[ 'Sniglet Regular' ] }
                                text={ book.name }
                            />
                        )}
                        <meshPhongMaterial
                            resourceId="textMaterial"
                        />
                        <meshPhongMaterial
                            color={ 0xff0000 }
                            resourceId="textMaterialHover"
                        />
                    </resources>

                    <ambientLight
                        color={ 0x777777 }
                    />

                    <directionalLight
                        color={ 0xffffff }
                        intensity={ 1.0 }
                        castShadow
                        position={ cameraPosition }
                    />

                    <mesh
                        position={ new THREE.Vector3(
                            -4.5,
                            0,
                            4.3
                        ) }
                        quaternion={ fontRotation }
                    >
                        <geometryResource
                            resourceId="title"
                        />
                        <materialResource
                            resourceId="textMaterial"
                        />
                    </mesh>

                    { books.map( ( book, index ) =>
                        <mesh
                            ref={ `book${ book.id }` }
                            position={ new THREE.Vector3(
                                index * 0.5,
                                0,
                                book.name.length * 0.35,
                            ) }
                            key={ book.id }
                            quaternion={ fontRotation }
                        >
                            <geometryResource
                                resourceId={ book.name }
                            />
                            <materialResource
                                resourceId={
                                    book === hoveredBook ?
                                        'textMaterialHover' : 'textMaterial'
                                }
                            />
                        </mesh>
                    )}
                </scene>
            </React3>
        </div>;

    }

}
