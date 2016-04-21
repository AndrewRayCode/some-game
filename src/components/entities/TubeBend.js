import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Mesh } from '../';

export default class TubeBend extends Component {

    render() {

        const {
            quaternion, position, rotation, scale, materialId, assets
        } = this.props;

        return <Mesh
            ref="child"
            position={ position }
            rotation={ rotation }
            quaternion={ quaternion }
            scale={ scale }
            assets={ assets }
            meshName="tubeBend"
            materialId={ materialId }
        />;

    }

}
