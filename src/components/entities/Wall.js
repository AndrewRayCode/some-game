import React, { Component } from 'react';
import THREE from 'three';

export default class Wall extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId,
        } = this.props;

        return <group
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
            scale={ scale }
        >
            <mesh
                ref="mesh"
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
