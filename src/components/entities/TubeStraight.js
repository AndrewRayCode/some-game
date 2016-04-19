import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );
const tubeRotation = new THREE.Euler( Math.PI / 2, 0, 0 );

export default class TubeStraight extends Component {

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ scale }
        >
            <Mesh
                ref="child"
                rotation={ tubeRotation }
                meshName="tube"
                assets={ assets }
                materialId={ materialId }
            />
        </group>;

    }

}
