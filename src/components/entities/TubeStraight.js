import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const tubeRotation = new THREE.Euler( Math.PI / 2, 0, 0 );

export default class TubeStraight extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;
        const { tube } = assets;

        if( !tube ) {
            return <mesh />;
        }

        const { faces, vertices, colors, faceVertexUvs } = tube;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                rotation={ tubeRotation }
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
