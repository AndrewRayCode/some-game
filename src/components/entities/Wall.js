import React, { Component } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class Wall extends Component {

    render() {

        const { position, rotation, scale, materialId, } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
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
