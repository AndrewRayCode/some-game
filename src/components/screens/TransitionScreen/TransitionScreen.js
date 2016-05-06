import React, { Component } from 'react';
import { Vector3, Euler, } from 'three';
import { getFrustrumAt } from 'helpers/Utils';

const cameraPosition = new Vector3( 0, 8, 0 );
const lookAt = new Vector3( 0, 0, 0 );

const sceneOffset = new Vector3( -300, -100, -200 );

const bgRotation = new Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new Vector3( 0, -2, 0 );

export default class TransitionScreen extends Component {

    render() {

        const { cameraFov, cameraAspect } = this.props;
        const frustum = getFrustrumAt( cameraPosition.y + Math.abs( bgPosition.y ), cameraFov, cameraAspect );
        const bgScale = new Vector3( 1, 1, 1 ).multiplyScalar( frustum.size().x );

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
