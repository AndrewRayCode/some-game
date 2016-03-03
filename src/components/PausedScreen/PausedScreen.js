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
const lookAt = new THREE.Vector3( 100, 10, 100 );
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

        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );


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

    onMouseDown( hovered, event ) {

        this.props.onSelect( hovered );

    }

    onMouseEnter( hovered, event ) {

        this.setState({ hovered });

    }

    onMouseLeave( hovered, event ) {

        if( this.state.hovered === hovered ) {

            this.setState({ hovered: null });

        }

    }

    render() {

        const { fonts } = this.props;
        const { hovered } = this.state;

        return <object3D
            position={ lookAt }
        >

            <perspectiveCamera
                name="pausedCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ new THREE.Vector3( 0, 0, 0 ) }
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
                onMouseEnter={ this.onMouseEnter.bind( null, 'unpause' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'unpause') }
                onMouseDown={ this.onMouseDown.bind( null, 'unpause' ) }
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
                onMouseEnter={ this.onMouseEnter.bind( null, 'menu' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'menu') }
                onMouseDown={ this.onMouseDown.bind( null, 'menu' ) }
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

        </object3D>;

    }

}
