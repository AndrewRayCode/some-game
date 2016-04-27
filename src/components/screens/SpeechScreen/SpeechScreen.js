import React, { Component, PropTypes } from 'react';
import THREE, { Euler, Vector3, } from 'three';
import { Mesh, Text, SelectableMenu, Player } from 'components';
import { frac } from 'helpers/Utils';

const tailRotation = new Euler( 0, 0, THREE.Math.degToRad( -60 ) );
const avatarRotation = new Euler( 0, Math.PI / 2, -1.0 );

const cameraPosition = new Vector3( 0, 8, 0 );
const lookAt = new Vector3( 0, 0, 0 );
const cameraFov = 75;

const circleRotation = new Euler( 0, -0.5, 0 );
const circleScale = new Vector3( 1, 1, 1 ).multiplyScalar( 1.1 );

const avatarRadius = 0.65;
const avatarDistance = 12;
const avatarOffset = {
    x: 70,
    y: 38,
};

const wreathRotation = new Euler( Math.PI / 2, 0, 0 );
const wreathScale = new Vector3( 1, 1, 1 ).multiplyScalar( 2.6 );
const wreathSpeed = 0.05;

const mouthOpenCloseSpeedMs = 1000;
const mouthOpenPercent = 1.0;

const localPlayerOffset = new Vector3( 0.1, 0, 0 );

const sceneOffset = new Vector3( 100, 100, 100 );

export default class SpeechScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        assets: PropTypes.object.isRequired,
        avatarPosition: PropTypes.object.isRequired,
        playerTexture: PropTypes.string.isRequired,
        playerTextureLegs: PropTypes.string.isRequired,
        playerTextureTail: PropTypes.string.isRequired,
    }

    render() {

        const {
            fonts, letters, onConfirm, onDeny, onClickRegionLeave,
            onClickRegionEnter, assets, playerTexture, playerTextureLegs,
            playerTextureTail, time, avatarPosition, gameWidth, gameHeight,
            cameraAspect,
        } = this.props;

        const { camera, } = this.refs;
        let projectedAvatarPosition = null;

        if( camera ) {

            const { y, } = avatarPosition;
            const vector = new Vector3(
                ( avatarOffset.x / gameWidth ) * 2 - 1,
                - ( ( avatarOffset.y + y ) / gameHeight ) * 2 + 1,
                1,
            );

            vector.unproject( camera );

            const direction = vector.sub( camera.position ).normalize();
            projectedAvatarPosition = camera.position.clone().add(
                direction.clone().multiplyScalar( avatarDistance )
            );

        }

        const headAnimations = {
            'Open Mouth': {
                weight: 1,
                percent: mouthOpenPercent * Math.abs( 0.5 - frac( 2 * ( time % mouthOpenCloseSpeedMs ) ) )
            },
        };

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="speechCamera"
                ref="camera"
                fov={ cameraFov }
                aspect={ gameWidth / gameHeight }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
            />

        { projectedAvatarPosition ?
            <group
                position={ projectedAvatarPosition }
            >
                <group
                    rotation={ circleRotation }
                    scale={ circleScale }
                >
                    <mesh
                        ref="mesh"
                        scale={ wreathScale }
                        rotation={
                            new Euler(
                                wreathRotation.x,
                                wreathRotation.y,
                                wreathRotation.z + ( time * wreathSpeed ),
                            )
                        }
                    >
                        <geometryResource
                            resourceId="1x1plane"
                        />
                        <materialResource
                            resourceId="wreathMaterial"
                        />
                    </mesh>
                </group>
                <Player
                    materialId="glowTextureFace"
                    assets={ assets }
                    position={ localPlayerOffset }
                    rotation={ avatarRotation }
                    radius={ avatarRadius }
                    time={ time }
                    tailRotation={ tailRotation }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    headAnimations={ headAnimations }
                />
            </group> : null }

        </object3D>;

    }

}
