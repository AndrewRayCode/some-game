import React, { Component, PropTypes } from 'react';
import THREE from 'three';

export default [
    <meshPhongMaterial
        key={ 8991 }
        resourceId="finishFlag"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.7 }
    />,
    <meshPhongMaterial
        key={ 8992 }
        resourceId="tubeMaterial"
        side={ THREE.DoubleSide }
        transparent
    >
        <texture
            url={ require( '../../assets/tube-pattern-1.png' ) }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
    <meshPhongMaterial
        key={ 8993 }
        resourceId="tubeBendMaterial"
        side={ THREE.DoubleSide }
        transparent
    >
        <texture
            url={ require( '../../assets/tube-bend-pattern-1.png' ) }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
];
