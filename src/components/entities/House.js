import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const houseScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.2 );
const housePosition = new THREE.Vector3( 0, -0.5, 0 );

export default class House extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;
        const { house } = assets;

        if( !house ) {
            return <mesh />;
        }
        const houseData = house.geometry[ 1 ];

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                scale={ houseScale }
                position={ housePosition }
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
