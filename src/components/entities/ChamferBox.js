import React, { Component } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class ChamferBox extends Component {

    render() {

        const {
            position, rotation, scale, materialId, topMaterialId, assets
        } = this.props;

        const { chamferBox } = assets;

        if( !chamferBox ) {
            return <group />;
        }

        const { faces, vertices, colors, faceVertexUvs } = chamferBox;

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

