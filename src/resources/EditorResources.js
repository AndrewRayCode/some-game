import React from 'react';
import THREE from 'three';

const gameWidth = 400;
const gameHeight = 400;

export default [
    <meshBasicMaterial
        resourceId="selectionWireframe"
        color={0x66ff00}
        wireframe
    />,
    <shape resourceId="row">
        <moveTo
            x={-gameWidth / 2}
            y={0}
        />
        <lineTo
            x={gameHeight / 2}
            y={0}
        />
    </shape>,
    <shape resourceId="col">
        <moveTo
            x={0}
            y={-gameWidth / 2}
        />
        <lineTo
            x={0}
            y={gameHeight / 2}
        />
    </shape>,
    <lineBasicMaterial
        resourceId="gridLineMaterial"
        color={0x222222}
        linewidth={0.5}
    />,
    <meshBasicMaterial
        resourceId="gridFloorMaterial"
        color={0xffffff}
        opacity={0.4}
        transparent
    />,
    <meshPhongMaterial
        resourceId="ghostMaterial"
        color={0xff0000}
        opacity={0.5}
        side={ THREE.DoubleSide }
        transparent
    />,
];
