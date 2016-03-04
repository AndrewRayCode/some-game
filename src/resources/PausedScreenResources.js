import React from 'react';
import THREE from 'three';

export default [
    <meshPhongMaterial
        resourceId="sceneOverlay"
        color={ 0xffffff }
        transparent
        opacity={ 0.1 }
    >
        <texture
            url={ require( '../../assets/pattern-raw.png' ) }
            wrapS={ THREE.RepeatWrapping }
            wrapT={ THREE.RepeatWrapping }
            repeat={ new THREE.Vector2( 5, 5 ) }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>
];
