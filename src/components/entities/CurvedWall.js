import React, { Component } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class CurvedWall extends Component {

    render() {

        const {
            position, rotation, scale, materialId, topMaterialId, assets,
        } = this.props;

        const { curvedWall, curvedWallTop } = assets;

        if( !curvedWall || !curvedWallTop ) {
            return <group />;
        }

        const { faces, vertices, colors, faceVertexUvs } = curvedWall;

        const {
            faces: facesTop,
            vertices: verticesTop,
            colors: colorsTop,
            faceVertexUvs: faceVertexUvsTop
        } = curvedWallTop;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
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
            <mesh
                ref="mesh2"
            >
                <geometry
                    faces={ facesTop }
                    vertices={ verticesTop }
                    colors={ colorsTop }
                    faceVertexUvs={ faceVertexUvsTop }
                />
                <materialResource
                    resourceId={ topMaterialId }
                />
            </mesh>
        </group>;

    }

}

