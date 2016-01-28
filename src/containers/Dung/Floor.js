import React, { Component } from 'react';
import THREE from 'three';

export default class Floor extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, time } = this.props;

        return <mesh
            ref="mesh"
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
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
