import React, { Component, PropTypes } from 'react';
import THREE from 'three';

export default [
    <boxGeometry
        resourceId="1x1box"
        width={ 1 }
        height={ 1 }
        depth={ 1 }
        widthSegments={ 1 }
        heightSegments={ 1 }
    />,
    <meshBasicMaterial
        resourceId="transparent"
        transparent
        opacity={ 0.0 }
    />,
    <meshPhongMaterial
        resourceId="finishFlag"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.7 }
    />
];
