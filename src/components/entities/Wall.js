import React, { Component } from 'react';
import THREE from 'three';

const topPosition = new THREE.Vector3( 0, 0.5, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

export default class Wall extends Component {

    render() {

        const { position, rotation, scale, materialId, } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                position={ topPosition }
                rotation={ topRotation }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId="wallSideMaterial"
                />
            </mesh>
            <mesh
                ref="mesh2"
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
