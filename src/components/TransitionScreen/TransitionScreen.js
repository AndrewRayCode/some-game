import React, { Component } from 'react';
import THREE from 'three';
import { getFrustrumAt } from '../../helpers/Utils';

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );

const sceneOffset = new THREE.Vector3( -300, -100, -200 );

const bgRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new THREE.Vector3( 0, -2, 0 );

const frustum = getFrustrumAt( cameraPosition.y + Math.abs( bgPosition.y ), cameraFov, cameraAspect );
const bgScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( frustum.size().x );

export default class TransitionScreen extends Component {

    render() {

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="transitionCamera"
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
                    resourceId="fractalTransition"
                />
            </mesh>

        </object3D>;

    }

}
