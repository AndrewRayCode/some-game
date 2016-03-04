import React, { Component, PropTypes } from 'react';
import THREE from 'three';

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
    </meshPhongMaterial>
];
