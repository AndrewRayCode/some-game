import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );
const houseScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.2 );
const housePosition = new THREE.Vector3( 0, -0.5, 0 );

export default class House extends Component {

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
            <Mesh
                ref="child"
                scale={ houseScale }
                position={ housePosition }
                assets={ assets }
                mesh="house"
                materialId={ materialId }
            />
        </group>;

    }

}
