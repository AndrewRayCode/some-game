import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

const topPosition = new THREE.Vector3( 0, 0.50, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

export default class MultiWall extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, topMaterialId,
            assets,
        } = this.props;

        return <group
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
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
                    resourceId={ topMaterialId || 'floorSideMaterial' }
                />
            </mesh>
            <Mesh
                ref="child"
                assets={ assets }
                meshName="multiwall"
                materialId={ materialId }
            />
        </group>;

    }

}
