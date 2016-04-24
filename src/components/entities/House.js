import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

const houseScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.2 );
const housePosition = new THREE.Vector3( 0, -0.5, 0 );

export default class House extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, assets
        } = this.props;

        return <group
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
            scale={ scale }
        >
            <Mesh
                ref="child"
                scale={ houseScale }
                position={ housePosition }
                assets={ assets }
                meshName="house"
                materialId={ materialId }
            />
        </group>;

    }

}
