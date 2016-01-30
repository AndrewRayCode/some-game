import React, { Component } from 'react';
import THREE from 'three';
import SubdivisionModifier from 'three-subdivision-modifier';

const modifier = new SubdivisionModifier( 2 );
const geo = new THREE.BoxGeometry( 1, 1, 1, 3, 3, 3 );
modifier.modify( geo );

const defaultScale = new THREE.Vector3( 1, 1, 1 );

export default class Pushy extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId } = this.props;

        return <mesh
            ref="mesh"
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale || defaultScale }
        >
            <geometry
                resourceId="pushyGeometry"
                faces={ geo.faces }
                vertices={ geo.vertices }
                colors={ geo.colors }
            />
            <materialResource
                resourceId={ materialId }
            />
        </mesh>;

    }

}
