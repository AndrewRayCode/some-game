import React, { Component, PropTypes } from 'react';
import THREE from 'three';

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
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
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
