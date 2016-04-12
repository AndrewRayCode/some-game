import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text, SelectableMenu } from 'components';

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

const topTextPosition = new THREE.Vector3( -4.5, 0, 0 );
const topTextScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.9 );

const bottomTextPosition =  new THREE.Vector3( -3, 0, 0 );
const bottomTextScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.9 );

const menuPosition = new THREE.Vector3( 2, 0, 0 );
const menuScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.6 );

export default class ConfirmMenuScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        assets: PropTypes.object.isRequired,
        playerTexture: PropTypes.string.isRequired,
        onConfirm: PropTypes.func.isRequired,
        onDeny: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
    }

    constructor( props ) {

        super( props );
        this._onAnimate = this._onAnimate.bind( this );

    }

    _onAnimate( elapsedTime, delta, keysDown ) {

        const { onConfirm, onDeny, } = this.props;

        if( keysDown.isFirstPress( 'ESC' ) ) {

            onDeny();

        } else if( keysDown.isFirstPress( 'R' ) ) {

            onConfirm();

        }

    }

    render() {

        const {
            fonts, letters, onConfirm, onDeny, onClickRegionLeave,
            onClickRegionEnter, assets, playerTexture
        } = this.props;

        return <object3D
            position={ sceneOffset }
            onUpdate={ this._onAnimate }
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
                position={ topTextPosition }
                scale={ topTextScale }
                text="Restart this"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />
            <Text
                position={ bottomTextPosition }
                scale={ bottomTextScale }
                text="Level?"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />
            
            <SelectableMenu
                position={ menuPosition }
                scale={ menuScale }
                fonts={ fonts }
                assets={ assets }
                letters={ letters }
                playerTexture={ playerTexture }
                onClickRegionEnter={ onClickRegionEnter }
                onClickRegionLeave={ onClickRegionLeave }
                menuOptions={[
                    {
                        text: 'Yup',
                        onSelect: onConfirm
                    },
                    {
                        text: 'Nope',
                        onSelect: onDeny
                    },
                ]}
            />

        </object3D>;

    }

}
