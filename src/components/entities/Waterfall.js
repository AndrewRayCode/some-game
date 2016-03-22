import React, { Component, PropTypes } from 'react';
import SegmentedEmitter from './SegmentedEmitter';

export default class Waterfall extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        debug: PropTypes.bool,
        time: PropTypes.number,
        playerRadius: PropTypes.number,
        playerBody: PropTypes.object,
        materialId: PropTypes.string.isRequired,
        foamMaterialId: PropTypes.string,
        helperMaterial: PropTypes.string,
    }

    render() {

        const {
            position, rotation, scale, world, paused, time, playerRadius,
            playerBody, materialId, foamMaterialId, maxLength, impulse,
            helperMaterial, debug
        } = this.props;

        return <SegmentedEmitter
            ref="child"
            foam
            maxLength={ maxLength || 10 }
            impulse={ impulse || 100 }
            rayCount={ 4 }
            materialId={ materialId }
            debug={ debug }
            foamMaterialId={ foamMaterialId }
            position={ position }
            rotation={ rotation }
            helperMaterial={ helperMaterial }
            scale={ scale }
            world={ world }
            paused={ paused }
            time={ time }
            playerRadius={ playerRadius }
            playerBody={ playerBody }
        />;

    }

}
