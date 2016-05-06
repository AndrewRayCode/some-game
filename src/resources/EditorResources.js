import React from 'react';
import THREE from 'three';

const gameWidth = 600;
const gameHeight = 600;

export default [
    <meshBasicMaterial
        key={ 84940 }
        resourceId="selectionWireframe"
        color={0x66ff00}
        wireframe
    />,
    <shape
        resourceId="row"
        key={ 84941 }
    >
        <moveTo
            x={-gameWidth / 2}
            y={0}
        />
        <lineTo
            x={gameHeight / 2}
            y={0}
        />
    </shape>,
    <shape
        resourceId="col"
        key={ 84942 }
    >
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
        key={ 84943 }
        resourceId="gridLineMaterial"
        color={0x222222}
        linewidth={0.5}
    />,
    <meshBasicMaterial
        key={ 84944 }
        resourceId="gridFloorMaterial"
        color={0xffffff}
        opacity={0.4}
        transparent
    />,
    <meshPhongMaterial
        key={ 84945 }
        resourceId="ghostMaterial"
        color={0xff0000}
        opacity={0.5}
        side={ THREE.DoubleSide }
        transparent
    />,
];
