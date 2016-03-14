import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const tubeScale = new THREE.Vector3( 0.9, 0.9, 0.9999 );

export default class House extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;
        const { tube } = assets;

        if( !tube ) {
            return <mesh />;
        }
        const houseData = tube;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                scale={ tubeScale }
            >
                <geometry
                    faces={ houseData.faces }
                    vertices={ houseData.vertices }
                    colors={ houseData.colors }
                    faceVertexUvs={ houseData.faceVertexUvs }
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
