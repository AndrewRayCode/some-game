import React, { Component } from 'react';
import THREE from 'three.js';

const extrudeSettings = {
    curveSegments: 10,
    amount: 1,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 10,
    bevelSize: 0,
    closed: false,
    bevelThickness: 0
};

export default class TubeBend extends Component {

    constructor(props, context) {
        super(props, context);
    }

    render() {

        return <group>
            <mesh
                position={ this.props.position }
                rotation={ this.props.rotation }
                scale={ this.props.scale }
                ref="mesh"
            >
                <extrudeGeometry
                    settings={extrudeSettings}
                >
                    <shapeResource
                        resourceId="tubeWall"
                    />
                </extrudeGeometry>
                <materialResource
                    resourceId={ this.props.materialId }
                />
            </mesh>

        </group>;

    }

}
