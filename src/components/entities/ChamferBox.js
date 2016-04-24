import React, { Component } from 'react';
import { Mesh } from '../';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class ChamferBox extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, assets,
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
                meshName="chamferBox"
                materialId={ materialId }
            />
        </group>;

    }

}

