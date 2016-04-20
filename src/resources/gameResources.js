import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { spiralTexture, growTexture } from 'Textures';
import CustomShaders from 'CustomShaders';

export default [
    <meshPhongMaterial
        key={ 4330 }
        resourceId="playerMaterial"
        color={ 0xFADE95 }
    />,
    <meshPhongMaterial
        key={ 4331 }
        resourceId="middleMaterial"
        color={ 0x6E0AF2 }
    />,
    <meshPhongMaterial
        key={ 4332 }
        resourceId="entranceMaterial"
        color={ 0xff0000 }
    />,
    <meshPhongMaterial
        key={ 4333 }
        resourceId="exitMaterial"
        color={ 0x0000ff }
    />,
    <meshPhongMaterial
        key={ 4334 }
        resourceId="pushyMaterial"
        color={ 0x462b2b }
    />,
    <meshPhongMaterial
        key={ 4335 }
        resourceId="floorSideMaterial"
        color={ 0xee8a6f }
    />,
    <meshPhongMaterial
        key={ 4336 }
        resourceId="wallSideMaterial"
        color={ 0xc1baa8 }
        transparent
        opacity={ 0.12 }
    />,
    <meshPhongMaterial
        key={ 4340 }
        resourceId="shrinkWrapMaterial"
        color={ 0x462B2B }
        opacity={ 0.3 }
        transparent
    />,
    <meshPhongMaterial
        key={ 4341 }
        resourceId="shrinkMaterial"
        color={0xffffff}
        side={ THREE.DoubleSide }
        transparent
    >
        <texture
            url={ spiralTexture }
            wrapS={ THREE.RepeatWrapping }
            wrapT={ THREE.RepeatWrapping }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
    <meshPhongMaterial
        key={ 4342 }
        resourceId="growWrapMaterial"
        color={ 0x462B2B }
        opacity={ 0.3 }
        transparent
    />,
    <meshPhongMaterial
        key={ 4343 }
        resourceId="growMaterial"
        color={ 0xffffff }
        side={ THREE.DoubleSide }
        transparent
    >
        <texture
            url={ growTexture }
            wrapS={ THREE.RepeatWrapping }
            wrapT={ THREE.RepeatWrapping }
            anisotropy={ 16 }
        />
    </meshPhongMaterial>,
    <sphereGeometry
        key={ 4344 }
        resourceId="playerGeometry"
        radius={ 0.5 }
        widthSegments={ 20 }
        heightSegments={ 20 }
    />,
    <meshPhongMaterial
        key={ 4345 }
        transparent
        opacity={ 0.9 }
        side={ THREE.DoubleSide }
        resourceId="greenDebugMaterial"
        color={ 0x00ff00 }
    />,
    <meshPhongMaterial
        key={ 4346 }
        transparent
        opacity={ 0.9 }
        side={ THREE.DoubleSide }
        resourceId="purpleDebugMaterial"
        color={ 0xff00ff }
    />,
    <meshPhongMaterial
        key={ 4347 }
        transparent
        opacity={ 0.9 }
        side={ THREE.DoubleSide }
        resourceId="redDebugMaterial"
        color={ 0xff0000 }
    />,
    <meshPhongMaterial
        key={ 4348 }
        transparent
        opacity={ 0.9 }
        side={ THREE.DoubleSide }
        resourceId="blueDebugMaterial"
        color={ 0x0000ff }
    />,
    <cylinderGeometry
        key={ 4349 }
        resourceId="1x1cylinder"
        radiusTop={ 0.5 }
        radiusBottom={ 0.5 }
        height={ 1 }
        radialSegments={ 5 }
        heightSegments={ 1 }
    />,
];
