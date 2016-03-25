import React, { Component } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );
const planeRotation = new THREE.Euler( 0, -THREE.Math.degToRad( 90 ), 0 );
const floorRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );
const floorPosition = new THREE.Vector3( 0, -0.48, 0 );

export default class FinishLine extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, floorMaterialId } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                position={ floorPosition }
                rotation={ floorRotation }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId={ floorMaterialId }
                />
            </mesh>
            <mesh
                ref="mesh2"
                rotation={ planeRotation }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
