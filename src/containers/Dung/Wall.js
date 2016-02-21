import React, { Component } from 'react';
import THREE from 'three';

const topPosition = new THREE.Vector3( 0, 0.51, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

function assignUvs( geometry ) {

    geometry.computeBoundingBox();

    const max     = geometry.boundingBox.max;
    const min     = geometry.boundingBox.min;

    const offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
    const range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs[0] = [];
    const faces = geometry.faces;

    for( let i = 0; i < geometry.faces.length; i++ ) {

        const v1 = geometry.vertices[faces[i].a];
        const v2 = geometry.vertices[faces[i].b];
        const v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
        ]);

    }

    geometry.uvsNeedUpdate = true;

}

export default class Wall extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, time } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                position={ topPosition }
                rotation={ topRotation }
            >
                <geometryResource
                    resourceId="planeGeometry"
                />
                <materialResource
                    resourceId="wallSideMaterial"
                />
            </mesh>
            <mesh
                ref="mesh2"
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
