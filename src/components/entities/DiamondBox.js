import React, { Component } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class DiamondBox extends Component {

    render() {

        const {
            position, rotation, scale, materialId, topMaterialId, assets
        } = this.props;

        const { diamondBox } = assets;

        if( !diamondBox ) {
            return <group />;
        }

        const { faces, vertices, colors, faceVertexUvs } = diamondBox;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
            <mesh
                ref="mesh"
            >
                <geometry
                    faces={ faces }
                    vertices={ vertices }
                    colors={ colors }
                    faceVertexUvs={ faceVertexUvs }
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}

