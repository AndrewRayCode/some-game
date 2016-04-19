import React, { Component } from 'react';
import { Mesh } from '../';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class ChamferBox extends Component {

    render() {

        const { position, rotation, scale, materialId, assets, } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
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

