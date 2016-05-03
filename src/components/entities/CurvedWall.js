import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

export default class CurvedWall extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, topMaterialId,
            assets,
        } = this.props;

        return <group
            position={ position }
            rotation={ rotation }
            quaternion={ quaternion }
            scale={ scale }
        >
            <Mesh
                ref="child"
                assets={ assets }
                meshName="curvedWallTop"
                materialId={ topMaterialId }
            />
            <Mesh
                ref="child2"
                assets={ assets }
                meshName="curvedWall"
                materialId={ materialId }
            />
        </group>;

    }

}

