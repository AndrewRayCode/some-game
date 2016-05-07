import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SegmentedEmitter from './SegmentedEmitter';
import ParticleEmitter from './ParticleEmitter';
import { smokeParticle } from 'ThreeMaterials';

const positionSpread = new THREE.Vector3( 0.0, 0, 0.6 );
const velocitySpread = new THREE.Vector3( 0.1, 0.0, 0.1 );
const sizeSpread = 0.5;

export default class Waterfall extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        quaternion: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        time: PropTypes.number,
        maxLength: PropTypes.number.isRequired,
        playerRadius: PropTypes.number,
        playerBody: PropTypes.object,
        colors: PropTypes.array,
        angle: PropTypes.array,
        angleSpread: PropTypes.number,
        opacity: PropTypes.array,
        materialId: PropTypes.string.isRequired,
        helperMaterialId: PropTypes.string,
    }

    render() {

        const {
            position, rotation, quaternion, scale, world, paused, time,
            playerRadius, playerBody, materialId, maxLength, impulse,
            helperMaterialId, debug, colors, velocity, angle, angleSpread,
            opacity
        } = this.props;

        if( !scale || !scale.y ) {
            console.log('wtf scael is',scale);
        }

        return <group>
            <ParticleEmitter
                rotation={ rotation }
                quaternion={ quaternion }
                emitterPosition={ position }
                texture={ smokeParticle }
                maxAge={ maxLength / velocity }
                positionSpread={ positionSpread }
                opacity={ opacity }
                opacitySpread={ 0.1 }
                velocity={ velocity }
                velocitySpread={ velocitySpread }
                colors={ colors }
                angle={ angle }
                angleSpread={ angleSpread }
                scale={ scale.y }
                size={ 0.7 }
                sizeSpread={ sizeSpread }
                wiggle={ 0.1 }
                wiggleSpread={ 0.2 }
                particleCount={ Math.min( 40 * maxLength, 500 ) }
            />
            <SegmentedEmitter
                ref="child"
                maxLength={ maxLength }
                impulse={ impulse || 100 }
                rayCount={ 2 }
                materialId={ debug ? 'ornateWall1' : 'transparent' }
                position={ position }
                rotation={ rotation }
                quaternion={ quaternion }
                scale={ scale }
                helperMaterialId={ helperMaterialId }
                world={ world }
                paused={ paused }
                time={ time }
                debug={ debug }
                playerRadius={ playerRadius }
                playerBody={ playerBody }
            />
        </group>;

    }

}
