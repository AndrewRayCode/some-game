import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Mesh } from '../';

export default class TubeBend extends Component {

    render() {

        const { position, rotation, scale, materialId, assets } = this.props;

        return <Mesh
            ref="child"
            position={ position }
            rotation={ rotation }
            scale={ scale }
            assets={ assets }
            meshName="tubeBend"
            materialId={ materialId }
        />;

    }

}
