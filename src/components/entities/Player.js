import React, { Component } from 'react';
import THREE from 'three';

export default class Player extends Component {

    constructor( props, context ) {

        super( props, context );

    }

    render() {

        const { position, rotation, quaternion, radius, scale, materialId } = this.props;

        return <mesh
            ref="mesh"
            position={ position }
            quaternion={ quaternion }
            scale={ new THREE.Vector3( 1, 1, 1 ).multiply( radius ) }
        >
            <geometryResource
                resourceId="playerGeometry"
            />
            <materialResource
                resourceId={ materialId }
            />
        </mesh>;

    }

}
