import React, { Component, PropTypes } from 'react';
import SegmentedEmitter from './SegmentedEmitter';

export default class Waterfall extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        time: PropTypes.number,
        playerRadius: PropTypes.number,
        playerBody: PropTypes.object,
        materialId: PropTypes.string.isRequired,
        helperMaterial: PropTypes.string,
    }

    render() {

        const {
            position, rotation, scale, world, paused, time, playerRadius,
            playerBody, materialId, maxLength, impulse, helperMaterial
        } = this.props;

        return <SegmentedEmitter
            ref="child"
            maxLength={ maxLength || 10 }
            impulse={ impulse || 100 }
            rayCount={ 2 }
            materialId={ materialId }
            position={ position }
            rotation={ rotation }
            scale={ scale }
            helperMaterial={ helperMaterial }
            world={ world }
            paused={ paused }
            time={ time }
            playerRadius={ playerRadius }
            playerBody={ playerBody }
        />;

    }

}

