import React, { Component } from 'react';
import THREE from 'three';
import { Mesh } from '../';

export default class DiamondBox extends Component {

    render() {

        const {
            position, rotation, quaternion, scale, materialId, assets,
        } = this.props;

        return <group
            position={ position }
            quaternion={ quaternion }
            scale={ scale }
        >
            <Mesh
                ref="child"
                assets={ assets }
                meshName="diamondBox"
                materialId={ materialId }
            />
        </group>;

    }

}

