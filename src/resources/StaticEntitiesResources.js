import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const tubeRadius = 0.5;
const bendSpline = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3( 0, 0, 0 ),
    new THREE.Vector3( 0, tubeRadius, 0 ),
    new THREE.Vector3( tubeRadius, tubeRadius )
);

const extrudeSettings = {
    curveSegments: 5,
    amount: 1,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 10,
    bevelSize: 0,
    closed: false,
    extrudePath: bendSpline,
    bevelThickness: 0
};

const straightExtrudeSettings = {
    curveSegments: 10,
    amount: 1,
    bevelEnabled: false,
    bevelSegments: 0,
    steps: 10,
    bevelSize: 0,
    closed: false,
    bevelThickness: 0
};

export default [
    <meshPhongMaterial
        resourceId="finishFlag"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.7 }
    />,
    <meshPhongMaterial
        resourceId="tubeMaterial"
        side={ THREE.DoubleSide }
        transparent
    >
        <texture
            url={ require( '../../assets/tube-pattern-1.png' ) }
            wrapS={ THREE.RepeatWrapping }
            wrapT={ THREE.RepeatWrapping }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
    <extrudeGeometry
        resourceId="tubeBend"
        settings={ extrudeSettings }
    >
        <shapeResource
            resourceId="tubeWall"
        />
    </extrudeGeometry>,
    <extrudeGeometry
        resourceId="tubeStraight"
        settings={ straightExtrudeSettings }
    >
        <shapeResource
            resourceId="tubeWall"
        />
    </extrudeGeometry>
];
