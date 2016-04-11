import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class Mesh extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string.isRequired,
        assets: PropTypes.object.isRequired,
        mesh: PropTypes.string.isRequired,
    };

    render() {

        const { position, rotation, scale, materialId, assets, mesh } = this.props;
        const meshData = assets[ mesh ];

        if( !meshData ) {
            return <group />;
        }

        const { geometry } = meshData;
        const { faces, vertices, colors, faceVertexUvs } = geometry;

        if( !faces ) {
            console.error( 'You passed in ',assets,' but it contained no faces for mesh',mesh );
            throw new Error( 'The mesh data you passed in did not contain any faces! Are you sure you\\re passing in the geometry?' );
        }

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
            <mesh
                ref="mesh"
            >
                <geometry
                    name={ mesh }
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
