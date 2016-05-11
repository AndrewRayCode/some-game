import React, { Component, PropTypes } from 'react';
import { Vector3, Euler, } from 'three';
import { Text, Logo, SelectableMenu } from 'components';
import { getFrustrumAt } from 'helpers/Utils';
import { P, ESC, SPACE, R, M, } from 'helpers/KeyCodes';

const cameraPosition = new Vector3( 0, 8, 0 );
const lookAt = new Vector3( 0, 0, 0 );

const sceneOffset = new Vector3( 100, 100, 100 );

const bgRotation = new Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new Vector3( 0, -2, 0 );

const logoPosition = new Vector3( -5, 0, 0 );
const logoScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.7 );

const titlePosition = new Vector3( -1.5, 0, 0 );
const titleScale = new Vector3( 1, 1, 1 ).multiplyScalar( 1.2 );

const menuPosition = new Vector3( 2.6, 0, 0 );
const menuScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.6 );

export default class PausedScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        assets: PropTypes.object.isRequired,
        playerTexture: PropTypes.string.isRequired,
        playerTextureLegs: PropTypes.string.isRequired,
        playerTextureTail: PropTypes.string.isRequired,
        onUnpause: PropTypes.func.isRequired,
        onRestart: PropTypes.func.isRequired,
        onShowConfirmMenuScreen: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
    }

    constructor( props ) {
        super( props );
        this._onAnimate = this._onAnimate.bind( this );
    }

    _onAnimate( elapsedTime, delta, keysDown ) {

        const {
            onUnpause, onRestart, onShowConfirmMenuScreen,
        } = this.props;

        if( keysDown.isFirstPress( P ) ||
            keysDown.isFirstPress( ESC ) ||
            keysDown.isFirstPress( SPACE )
        ) {

            onUnpause();

        } else if( keysDown.isFirstPress( R ) ) {

            onRestart();

        } else if( keysDown.isFirstPress( M ) ) {

            onShowConfirmMenuScreen();

        }

    }

    render() {

        const {
            fonts, letters, onUnpause, onRestart, onShowConfirmMenuScreen,
            onShowConfirmRestartBookMenuScreen, onClickRegionEnter,
            onClickRegionLeave, assets, playerTexture, playerTextureLegs,
            playerTextureTail, cameraAspect, cameraFov,
        } = this.props;

        const frustum = getFrustrumAt( cameraPosition.y + Math.abs( bgPosition.y ), cameraFov, cameraAspect );
        const bgScale = new Vector3( 1, 1, 1 ).multiplyScalar( frustum.size().x );

        return <object3D
            onUpdate={ this._onAnimate }
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
                materialId="universeInAMenu"
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
                onClickRegionEnter={ onClickRegionEnter }
                onClickRegionLeave={ onClickRegionLeave }
                playerTexture={ playerTexture }
                playerTextureLegs={ playerTextureLegs }
                playerTextureTail={ playerTextureTail }
                menuOptions={[
                    {
                        text: 'Unpause (p)',
                        onSelect: onUnpause,
                    },
                    {
                        text: 'Restart chapter (r)',
                        onSelect: onRestart,
                    },
                    {
                        text: 'Restart book (b)',
                        onSelect: onShowConfirmRestartBookMenuScreen,
                    },
                    {
                        text: 'Return to menu (m)',
                        onSelect: onShowConfirmMenuScreen,
                    },
                ]}
            />

        </object3D>;

    }

}
