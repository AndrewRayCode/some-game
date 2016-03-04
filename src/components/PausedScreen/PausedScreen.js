import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { browserHistory } from 'react-router';
import KeyCodes from '../../helpers/KeyCodes';
import shaderFrog from '../../helpers/shaderFrog';
import { without } from '../../helpers/Utils';
import styles from '../../containers/Game/Game.scss';
import classNames from 'classnames/bind';
import { Text } from '../';

const cx = classNames.bind( styles );
const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );
const raycaster = new THREE.Raycaster();

const sceneOffset = new THREE.Vector3( 100, 100, 100 );

export default class PausedScreen extends Component {
    
    static propTypes = {
        letters: React.PropTypes.object.isRequired,
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

        const { fonts, letters } = this.props;
        const { hovered } = this.state;

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="pausedCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
                ref="camera"
            />

            <Text
                position={ new THREE.Vector3( -4.5, 0, 0 ) }
                scale={ new THREE.Vector3( 0.7, 0.7, 0.7 ) }
                fonts={ fonts }
                letters={ letters }
                fontName="Sniglet Regular"
                text="Today I'm A Galaxy"
                materialId="textMaterial"
            />

            <Text
                position={ new THREE.Vector3( -1, 0, 0 ) }
                text="paused"
                materialId="textMaterial"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'unpause' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'unpause') }
                onMouseDown={ this.onMouseDown.bind( null, 'unpause' ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 1, 0, 0 ) }
                text="Unpause"
                materialId={
                    hovered === 'unpause' ?
                        'textMaterialHover' : 'textMaterial'
                }
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'menu' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'menu') }
                onMouseDown={ this.onMouseDown.bind( null, 'menu' ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 2, 0, 0 ) }
                text="Return to Menu (m)"
                materialId={
                    hovered === 'menu' ?
                        'textMaterialHover' : 'textMaterial'
                }
                fonts={ fonts }
                letters={ letters }
            />

        </object3D>;

    }

}
