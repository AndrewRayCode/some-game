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

const bgRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new THREE.Vector3( 0, -2, 0 );
const bgScale = new THREE.Vector3( 18, 18, 18 );

export default class PausedScreen extends Component {
    
    static propTypes = {
        letters: React.PropTypes.object.isRequired,
        fonts: React.PropTypes.object.isRequired,
        onUnpause: React.PropTypes.func.isRequired,
        onReturnToMenu: React.PropTypes.func.isRequired,
        onClickRegionLeave: React.PropTypes.func.isRequired,
        onClickRegionEnter: React.PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = {};

        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );

    }

    onMouseDown( hovered, event ) {

        if( hovered === 'unpause' ) {

            this.props.onUnpause();

        } else if( hovered === 'menu' ) {

            this.props.onReturnToMenu();

        }

    }

    onMouseEnter( hovered, event ) {

        this.props.onClickRegionEnter();
        this.setState({ [ hovered ]: true });

    }

    onMouseLeave( hovered, event ) {

        this.props.onClickRegionLeave();
        this.setState({ [ hovered ]: null });

    }

    render() {

        const { fonts, letters } = this.props;
        const { unpause, menu } = this.state;

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

            <mesh
                scale={ bgScale }
                rotation={ bgRotation }
                position={ bgPosition }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId="sceneOverlay"
                />
            </mesh>

            <Text
                position={ new THREE.Vector3( -4.5, 0, 0 ) }
                scale={ new THREE.Vector3( 0.7, 0.7, 0.7 ) }
                fonts={ fonts }
                letters={ letters }
                fontName="Sniglet Regular"
                text="Today I'm A Galaxy"
                materialId="universeInALetter"
            />

            <Text
                position={ new THREE.Vector3( -1, 0, 0 ) }
                scale={ new THREE.Vector3( 1.5, 1.5, 1.5 ) }
                text="Paused"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'unpause' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'unpause') }
                onMouseDown={ this.onMouseDown.bind( null, 'unpause' ) }
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.7 ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 1, 0, 0 ) }
                text="Unpause (p)"
                materialId={
                    unpause ? 'universeInAMenuHover' : 'universeInAMenu'
                }
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'menu' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'menu') }
                onMouseDown={ this.onMouseDown.bind( null, 'menu' ) }
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.7 ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 2.5, 0, 0 ) }
                text="Return to Menu (m)"
                materialId={
                    menu ? 'universeInAMenuHover' : 'universeInAMenu'
                }
                fonts={ fonts }
                letters={ letters }
            />

        </object3D>;

    }

}
