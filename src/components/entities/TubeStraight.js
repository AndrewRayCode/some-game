import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

const localTubeRotation = new THREE.Euler( Math.PI / 2, 0, 0 );

export default class TubeStraight extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, assets
        } = this.props;

        return <group
            position={ position }
            quaternion={ quaternion }
            scale={ scale }
        >
            <Mesh
                ref="child"
                rotation={ localTubeRotation }
                meshName="tube"
                assets={ assets }
                materialId={ materialId }
            />
        </group>;

    }

}
