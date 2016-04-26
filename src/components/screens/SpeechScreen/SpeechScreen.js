import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Mesh, Text, SelectableMenu, Player } from 'components';
import { frac } from 'helpers/Utils';

const tubeRotation = new THREE.Euler( THREE.Math.degToRad( 80 ), 0, 0 );
const tubeScale = new THREE.Vector3( 0.9, 0.9, 0.1 );
const rotationAngle = 0.09;
const rotationSpeed = 0.5;

const avatarRotation = new THREE.Euler( 0, Math.PI / 2, -1.0 );

const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );
const cameraFov = 75;

const avatarDistance = 12;
const ringDistance = 11;
const avatarOffset = {
    x: 70,
    y: 40,
};

const mouthOpenCloseSpeedMs = 2000;

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

const tubeRadius = 0.5;
const bendSpline = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, tubeRadius, 0 ),
    new THREE.Vector3( tubeRadius, tubeRadius )
);

const extrudeSettings = {
    curveSegments: 5,
    amount: 1,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 10,
    bevelSize: 0,
    closed: false,
    extrudePath: bendSpline,
    bevelThickness: 0
};


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
        let projectedRingPosition = null;

        if( camera ) {

            const { y, } = avatarPosition;
            const vector = new THREE.Vector3(
                ( avatarOffset.x / gameWidth ) * 2 - 1,
                - ( ( avatarOffset.y + y ) / gameHeight ) * 2 + 1,
                1,
            );

            vector.unproject( camera );

            const direction = vector.sub( camera.position ).normalize();
            projectedAvatarPosition = camera.position.clone().add(
                direction.clone().multiplyScalar( avatarDistance )
            );
            projectedRingPosition = camera.position.clone().add(
                direction.clone().multiplyScalar( ringDistance )
            );

        }

        const headAnimations = {
            'Open Mouth': {
                weight: 1,
                percent: 0.75 * Math.abs( 0.5 - frac( 2 * ( time % mouthOpenCloseSpeedMs ) ) )
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

            { projectedRingPosition ? <Mesh
                scale={ tubeScale }
                rotation={ new THREE.Euler(
                    tubeRotation.x + rotationAngle * Math.sin( time * rotationSpeed ),
                    tubeRotation.y + rotationAngle * Math.cos( time * rotationSpeed ),
                    tubeRotation.z,
                ) }
                position={ projectedRingPosition }
                meshName="genericTube"
                assets={ assets }
                materialId="white"
            /> : null }

            { projectedAvatarPosition ? <Player
                materialId="glowTextureFace"
                assets={ assets }
                rotation={ avatarRotation }
                radius={ 0.5 }
                time={ time }
                playerTexture={ playerTexture }
                playerTextureLegs={ playerTextureLegs }
                position={ projectedAvatarPosition }
                headAnimations={ headAnimations }
            /> : null }

        </object3D>;

    }

}
