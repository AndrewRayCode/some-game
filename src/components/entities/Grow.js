import React, { Component } from 'react';
import THREE, { Euler, Vector3, } from 'three';
import { easeInOutCubic } from 'easing-utils';

const rotationOffset = new Euler( Math.PI / 2, 0, 0 );
const billboardScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.6 );
const rotationSpeed = -0.08;
const bounceSpeed = 0.0025;
const bounceLimit = 0.075;

export default class Grow extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const {
            position, scale, materialId, wrapMaterialId, time
        } = this.props;

        return <group
            position={ position }
            scale={ scale }
        >
            <group
                position={
                    new Vector3(
                        0,
                        0,
                        bounceLimit * Math.sin( bounceSpeed * time )
                    )
                }
            >
                <group
                    rotation={ new Euler(
                        0,
                        THREE.Math.degToRad( time * rotationSpeed ),
                        0
                    ) }
                >
                    <mesh
                        scale={ billboardScale }
                        rotation={ rotationOffset }
                        ref="mesh2"
                    >
                        <geometryResource
                            resourceId="1x1plane"
                        />
                        <materialResource
                            resourceId="growMaterial"
                        />
                    </mesh>
                    <mesh
                        rotation={ new Euler(
                            THREE.Math.degToRad( time * rotationSpeed ),
                            0,
                            0
                        ) }
                        ref="mesh"
                    >
                        <geometryResource
                            resourceId="radius1sphere"
                        />
                        <materialResource
                            resourceId={ wrapMaterialId || 'growWrapMaterial' }
                        />
                    </mesh>
                </group>
            </group>
        </group>;

    }

}
