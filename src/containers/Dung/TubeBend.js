import React, { Component } from 'react';
import THREE from 'three.js';

const tubeRadius = 0.5;
const bendSpline = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, tubeRadius, 0 ),
    new THREE.Vector3( tubeRadius, tubeRadius )
);

const extrudeSettings = {
    curveSegments: 50,
    amount: 10,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 18,
    bevelSize: 0,
    closed: false,
    extrudePath: bendSpline,
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
