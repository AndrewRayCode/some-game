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

export default class PausedScreen extends Component {
    
    static propTypes = {
        fonts: React.PropTypes.object.isRequired,
        onUnpause: React.PropTypes.func.isRequired,
        onReturnToMenu: React.PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        this.state = {
            hovered: null,
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

        if(
            ( KeyCodes.ESC in keysDown ) || ( KeyCodes.P in keysDown ) ||
                ( KeyCodes.SPACE in keysDown )
        ) {

            this.props.onUnpause();

        } else if( KeyCodes.M in keysDown ) {

            this.props.onReturnToMenu();

        }

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

        let hovered = null;
        if( intersections.length ) {

            const objectIntersection = intersections[ 0 ].object;

            switch( objectIntersection ) {
                case this.refs.unpauseTextMesh:
                    hovered = 'unpause';
                    break;

                case this.refs.menuTextMesh:
                    hovered = 'menu';
                    break;

                default:
                    hovered = null;

            }

        }

        this.setState({ hovered });

    }

    onMouseDown( event ) {

        const { hovered } = this.state;

        if( hovered === 'unpause' ) {
            this.props.onUnpause();
        } else if( hovered === 'menu' ) {
            this.props.onReturnToMenu();
        }

    }

    render() {

        const { fonts } = this.props;
        const { hovered } = this.state;
                    
        if( !( 'Sniglet Regular' in fonts ) ) {
            return <div />;
        }

        return <div
            onMouseMove={ this.onMouseMove }
            onMouseDown={ this.onMouseDown }
            style={{ width: gameWidth, height: gameHeight }}
            className={ cx({ hovered }) }
            ref="container"
        >
            <React3
                alpha
                clearAlpha={ 0.3 }
                clearColor={ 0xffffff }
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
                        <textGeometry
                            resourceId="paused"
                            size={ 1.5 }
                            height={ 0.2 }
                            bevelEnabled
                            bevelThickness={ 0.02 }
                            bevelSize={ 0.01 }
                            font={ fonts[ 'Sniglet Regular' ] }
                            text="Paused!"
                        />
                        <textGeometry
                            resourceId="unpause"
                            size={ 0.7 }
                            height={ 0.2 }
                            bevelEnabled
                            bevelThickness={ 0.02 }
                            bevelSize={ 0.01 }
                            font={ fonts[ 'Sniglet Regular' ] }
                            text="Unpause (p)"
                        />
                        <textGeometry
                            resourceId="menu"
                            size={ 0.7 }
                            height={ 0.2 }
                            bevelEnabled
                            bevelThickness={ 0.02 }
                            bevelSize={ 0.01 }
                            font={ fonts[ 'Sniglet Regular' ] }
                            text="Return to Menu (m)"
                        />
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

                    <mesh
                        position={ new THREE.Vector3(
                            -1,
                            0,
                            4.8
                        ) }
                        quaternion={ fontRotation }
                    >
                        <geometryResource
                            resourceId="paused"
                        />
                        <materialResource
                            resourceId="textMaterial"
                        />
                    </mesh>

                    <mesh
                        ref="unpauseTextMesh"
                        position={ new THREE.Vector3(
                            1,
                            0,
                            4.8
                        ) }
                        quaternion={ fontRotation }
                    >
                        <geometryResource
                            resourceId="unpause"
                        />
                        <materialResource
                            resourceId={
                                hovered === 'unpause' ?
                                    'textMaterialHover' : 'textMaterial'
                            }
                        />
                    </mesh>

                    <mesh
                        ref="menuTextMesh"
                        position={ new THREE.Vector3(
                            2,
                            0,
                            4.8
                        ) }
                        quaternion={ fontRotation }
                    >
                        <geometryResource
                            resourceId="menu"
                        />
                        <materialResource
                            resourceId={
                                hovered === 'menu' ?
                                    'textMaterialHover' : 'textMaterial'
                            }
                        />
                    </mesh>

                </scene>
            </React3>
        </div>;

    }

}
