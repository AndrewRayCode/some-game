import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import Textures from '../helpers/Textures';
import CustomShaders from '../helpers/CustomShaders';

export default [
    ...Object.keys( Textures ).map( key =>
        <meshPhongMaterial
            key={ key }
            resourceId={ key }
            color={ 0xffffff }
        >
            <texture
                url={ Textures[ key ] }
                wrapS={ THREE.RepeatWrapping }
                wrapT={ THREE.RepeatWrapping }
                anisotropy={ 16 }
            />
        </meshPhongMaterial>
    ),
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
    />,
    <meshPhongMaterial
        resourceId="textMaterial"
    />,
    <meshPhongMaterial
        color={ 0xff0000 }
        resourceId="textMaterialHover"
    />,
    <planeBufferGeometry
        resourceId="1x1plane"
        width={ 1 }
        height={ 1 }
        widthSegments={ 1 }
        heightSegments={ 1 }
    />,
    <sphereGeometry
        resourceId="radius1sphere"
        radius={ 0.5 }
        widthSegments={ 6 }
        heightSegments={ 6 }
    />
];
