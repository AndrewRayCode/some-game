import React, { Component } from 'react';
import THREE from 'three';

const topPosition = new THREE.Vector3( 0, 0.50, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

export default class MultiWall extends Component {

    render() {

        const {
            position, rotation, scale, materialId, topMaterialId, assets
        } = this.props;

        const { multiwall } = assets;

        if( !multiwall ) {
            return <group />;
        }

        const { faces, vertices, colors, faceVertexUvs } = multiwall;

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
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId={ topMaterialId || 'floorSideMaterial' }
                />
            </mesh>
            <mesh
                ref="mesh"
            >
                <geometry
                    faces={ faces }
                    vertices={ vertices }
                    colors={ colors }
                    faceVertexUvs={ faceVertexUvs }
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
