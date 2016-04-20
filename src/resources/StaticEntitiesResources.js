import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { tubePattern1, tubeBendPattern1 } from 'Textures';

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
            url={ tubePattern1 }
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
            url={ tubeBendPattern1 }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
];
