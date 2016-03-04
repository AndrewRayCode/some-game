import React, { Component } from 'react';
import THREE from 'three';

const offset = new THREE.Vector3( 0, -0.5, 0 );
const rotationOffset = new THREE.Euler( 0, Math.PI / 2, 0 );

export default class TubeBend extends Component {

    constructor(props, context) {

        super( props, context );

    }

    render() {

        const { position, rotation, scale, materialId } = this.props;

        return <group
            position={ position }
            rotation={ new THREE.Euler().setFromQuaternion( rotation ) }
            scale={ scale }
        >

            <mesh
                position={ offset }
                rotation={ rotationOffset }
                ref="mesh"
            >
                <geometryResource
                    resourceId="tubeBend"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>

        </group>;

    }

}
