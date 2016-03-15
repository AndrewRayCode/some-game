import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import Textures from '../helpers/Textures';
import CustomShaders from '../helpers/CustomShaders';

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
        transparent
        opacity={ 0.12 }
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
            url={ require( '../../assets/spiral-texture.png' ) }
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
            url={ require( '../../assets/grow-texture.png' ) }
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
    />
];
