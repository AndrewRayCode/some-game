import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text, Logo, SelectableMenu } from '../';
import { getFrustrumAt } from '../../helpers/Utils';

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );

const sceneOffset = new THREE.Vector3( 100, 100, 100 );

const bgRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new THREE.Vector3( 0, -2, 0 );

const logoPosition = new THREE.Vector3( -5, 0, 0 );
const logoScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.7 );

const titlePosition = new THREE.Vector3( -1.9, 0, 0 );
const titleScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 1.5 );

const menuPosition = new THREE.Vector3( 2, 0, 0 );
const menuScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.6 );

const frustum = getFrustrumAt( cameraPosition.y + Math.abs( bgPosition.y ), cameraFov, cameraAspect );
const bgScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( frustum.size().x );

export default class PausedScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        onUnpause: PropTypes.func.isRequired,
        onRestart: PropTypes.func.isRequired,
        onShowConfirmMenuScreen: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
    }

    render() {

        const {
            fonts, letters, onUnpause, onRestart, onShowConfirmMenuScreen,
            onClickRegionEnter, onClickRegionLeave
        } = this.props;

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="pausedCamera"
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
                    resourceId="pauseBackground"
                />
            </mesh>

            <Logo
                position={ logoPosition }
                scale={ logoScale }
                fonts={ fonts }
                letters={ letters }
            />

            <Text
                position={ titlePosition }
                scale={ titleScale }
                text="Paused"
                materialId="universeInALetter"
                fontName="Sniglet Regular"
                fonts={ fonts }
                letters={ letters }
            />

            <SelectableMenu
                position={ menuPosition }
                scale={ menuScale }
                fonts={ fonts }
                letters={ letters }
                onClickRegionEnter={ onClickRegionEnter }
                onClickRegionLeave={ onClickRegionLeave }
                menuOptions={[
                    {
                        text: 'Unpause (p)',
                        onSelect: onUnpause
                    },
                    {
                        text: 'Restart this level (r)',
                        onSelect: onRestart
                    },
                    {
                        text: 'Return to menu (m)',
                        onSelect: onShowConfirmMenuScreen
                    },
                ]}
            />

        </object3D>;

    }

}
