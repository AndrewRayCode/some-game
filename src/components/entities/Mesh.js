import React, { Component, PropTypes } from 'react';
import THREE from 'three';

export default class Mesh extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        quaternion: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string.isRequired,
        assets: PropTypes.object.isRequired,
        meshName: PropTypes.string.isRequired,
    };

    render() {

        const {
            position, quaternion, rotation, scale, materialId, assets,
            meshName,
        } = this.props;
        const meshData = assets[ meshName ];

        if( !meshData ) {
            return <group />;
        }

        const { geometry } = meshData;
        const { faces, vertices, colors, faceVertexUvs } = geometry;

        if( !faces ) {
            console.error( 'You passed in ',assets,' but it contained no faces for mesh',meshName );
            throw new Error( 'The mesh data you passed in did not contain any faces! Are you sure you\\re passing in the geometry?' );
        }

        return <group
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
            scale={ scale }
        >
            <mesh
                ref="mesh"
            >
                <geometry
                    name={ meshName }
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
