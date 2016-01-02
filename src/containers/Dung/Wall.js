import React, { Component } from 'react';
import THREE from 'three';

export default class Wall extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId } = this.props;

        return <mesh
            position={ position }
            rotation={ new THREE.Euler().setFromQuaternion( rotation ) }
            scale={ scale }
            ref="mesh"
            castShadow
            receiveShadow
        >
            <geometryResource
                resourceId="1x1box"
            />
            <materialResource
                resourceId={ materialId }
            />
        </mesh>;

    }

}
