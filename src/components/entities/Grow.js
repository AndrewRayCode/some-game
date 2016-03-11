import React, { Component } from 'react';
import THREE from 'three';

const rotationOffset = new THREE.Euler( Math.PI / 2, 0, 0 );
const billboardScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.6 );

export default class Grow extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const {
            position, rotation, scale, wrapMaterialId, time
        } = this.props;

        return <group
            rotation={ new THREE.Euler(
                0,
                THREE.Math.degToRad( time * 50 ),
                0
            ) }
            position={ position }
            scale={ scale }
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
                rotation={ new THREE.Euler(
                    THREE.Math.degToRad( time * 50 ),
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
        </group>;

    }

}
