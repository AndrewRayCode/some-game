import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import Textures from 'Textures';

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
        key={ 11947 }
        resourceId="1x1box"
        width={ 1 }
        height={ 1 }
        depth={ 1 }
        widthSegments={ 1 }
        heightSegments={ 1 }
    />,
    <meshBasicMaterial
        key={ 11948 }
        resourceId="transparent"
        visible={ false }
    />,
    <meshPhongMaterial
        key={ 11949 }
        resourceId="finishFlag"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.7 }
    />,
    <meshPhongMaterial
        key={ 11950 }
        resourceId="placeholder2"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.8 }
        color={ 0x00ff00 }
    />,
    <meshPhongMaterial
        key={ 11951 }
        resourceId="placeholder"
        side={ THREE.DoubleSide }
        transparent
        opacity={ 0.8 }
        color={ 0xff0000 }
    />,
    <planeBufferGeometry
        key={ 11952 }
        resourceId="1x1plane"
        width={ 1 }
        height={ 1 }
        widthSegments={ 1 }
        heightSegments={ 1 }
    />,
    <sphereGeometry
        key={ 11953 }
        resourceId="radius1sphere"
        radius={ 0.5 }
        widthSegments={ 6 }
        heightSegments={ 6 }
    />,
    <meshBasicMaterial
        key={ 11954 }
        resourceId="semitransparent"
        opacity={ 0.1 }
        color={ 0xff0000 }
    />,
    <meshPhongMaterial
        key={ 11955 }
        resourceId="white"
        color={ 0xffffff }
    />,
    <meshPhongMaterial
        key={ 11956 }
        resourceId="lightGray"
        color={ 0x666666 }
    />,
];
