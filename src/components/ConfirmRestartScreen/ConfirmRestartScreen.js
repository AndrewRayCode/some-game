import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text } from '../';

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );

const sceneOffset = new THREE.Vector3( 100, 100, 100 );

const bgRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new THREE.Vector3( 0, -2, 0 );
const bgScale = new THREE.Vector3( 18, 18, 18 );

export default class ConfirmRestartScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        onConfirm: PropTypes.func.isRequired,
        onDeny: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = {};

        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );

    }

    onMouseDown( hovered, event ) {

        if( hovered === 'confirm' ) {

            this.props.onConfirm();

        } else if( hovered === 'deny' ) {

            this.props.onDeny();

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
        const { confirm, deny } = this.state;

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="confirmRestartCamera"
                ref="camera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
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
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.9 ) }
                text="Restart This"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />
            <Text
                position={ new THREE.Vector3( -3, 0, 0 ) }
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.9 ) }
                text="Level?"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'confirm' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'confirm') }
                onMouseDown={ this.onMouseDown.bind( null, 'confirm' ) }
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.7 ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 1, 0, 0 ) }
                text="Restart"
                materialId={
                    confirm ? 'universeInAMenuHover' : 'universeInAMenu'
                }
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                onMouseEnter={ this.onMouseEnter.bind( null, 'deny' ) }
                onMouseLeave={ this.onMouseLeave.bind( null, 'deny') }
                onMouseDown={ this.onMouseDown.bind( null, 'deny' ) }
                scale={ new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.7 ) }
                fontName="Sniglet Regular"
                position={ new THREE.Vector3( 2.5, 0, 0 ) }
                text="Cancel"
                materialId={
                    deny ? 'universeInAMenuHover' : 'universeInAMenu'
                }
                fonts={ fonts }
                letters={ letters }
            />

        </object3D>;

    }

}
