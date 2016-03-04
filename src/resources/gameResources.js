import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import Textures from '../helpers/Textures';
import CustomShaders from '../helpers/CustomShaders';

export default [
    <meshPhongMaterial
        resourceId="playerMaterial"
        color={ 0xFADE95 }
    />,
    <meshPhongMaterial
        resourceId="middleMaterial"
        color={ 0x6E0AF2 }
    />,
    <meshPhongMaterial
        resourceId="entranceMaterial"
        color={ 0xff0000 }
    />,
    <meshPhongMaterial
        resourceId="exitMaterial"
        color={ 0x0000ff }
    />,
    <meshPhongMaterial
        resourceId="pushyMaterial"
        color={ 0x462b2b }
    />,
    <meshPhongMaterial
        resourceId="floorSideMaterial"
        color={ 0xee8a6f }
        transparent
        opacity={ 0.12 }
    />,
    <meshPhongMaterial
        resourceId="wallSideMaterial"
        color={ 0xc1baa8 }
        transparent
        opacity={ 0.12 }
    />,
    <shape resourceId="tubeWall">
        <absArc
            x={ 0 }
            y={ 0 }
            radius={ 0.5 }
            startAngle={ 0 }
            endAngle={ Math.PI * 2 }
            clockwise={ false }
        />
        <hole>
            <absArc
                x={ 0 }
                y={ 0 }
                radius={ 0.4 }
                startAngle={ 0 }
                endAngle={ Math.PI * 2 }
                clockwise
            />
        </hole>
    </shape>,
    <meshPhongMaterial
        resourceId="tubeMaterial"
        color={ 0xffffff }
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
    <meshPhongMaterial
        resourceId="shrinkWrapMaterial"
        color={ 0x462B2B }
        opacity={ 0.3 }
        transparent
    />,
    <meshPhongMaterial
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
        resourceId="growWrapMaterial"
        color={ 0x462B2B }
        opacity={ 0.3 }
        transparent
    />,
    <meshPhongMaterial
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
        resourceId="playerGeometry"
        radius={ 0.5 }
        widthSegments={ 20 }
        heightSegments={ 20 }
    />
];
