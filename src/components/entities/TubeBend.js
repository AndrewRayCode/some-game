import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class TubeBend extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;
        const { tubeBend } = assets;

        if( !tubeBend ) {
            return <group />;
        }

        const { faces, vertices, colors, faceVertexUvs } = tubeBend;

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
