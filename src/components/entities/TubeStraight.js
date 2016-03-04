import React, { Component } from 'react';
import THREE from 'three';

const offset = new THREE.Vector3( 0, 0, -0.5 );

export default class TubeBend extends Component {

    constructor(props, context) {

        super(props, context);

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
                ref="mesh"
            >
                <geometryResource
                    resourceId="tubeStraight"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>

        </group>;

    }

}
