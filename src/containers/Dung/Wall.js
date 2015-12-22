import React, { Component } from 'react';
import THREE from 'three.js';

export default class Wall extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        return <group>
            <mesh
                position={ this.props.position }
                rotation={ this.props.rotation }
                scale={ this.props.scale }
                ref="mesh"
                castShadow
                receiveShadow
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId={ this.props.materialId }
                />
            </mesh>
        </group>;

    }

}
