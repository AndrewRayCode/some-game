import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SegmentedEmitter from './SegmentedEmitter';
import ParticleEmitter from './ParticleEmitter';

const positionSpread = new THREE.Vector3( 0.0, 0, 0.6 );
const opacity = [ 0.1, 0 ];
const velocitySpread = new THREE.Vector3( 0.1, 0.0, 0.1 );
const color = [
    new THREE.Color( 0xffffff ),
    new THREE.Color( 0xdddddd ),
];
const angle = [ -Math.PI, Math.PI ];
const angleSpread = Math.PI / 2;
const sizeSpread = new THREE.Vector3( 0.5, 0.5, 0.5 );

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

    constructor( props ) {

        super( props );

        if( __CLIENT__ ) {
            this.state = {
                smokeParticle: THREE.ImageUtils.loadTexture(
                    require( '../../../assets/smoke-particle.png' )
                )
            };
        }

    }

    render() {

        const {
            position, rotation, scale, world, paused, time, playerRadius,
            playerBody, materialId, maxLength, impulse, helperMaterial,
            debug
        } = this.props;

        const defaultMaxLength = maxLength || 10;
        const velocity = 2;

        return <group>
            <ParticleEmitter
                rotation={ rotation }
                emitterPosition={ position }
                texture={ this.state.smokeParticle }
                maxAge={ defaultMaxLength / velocity }
                positionSpread={ positionSpread }
                opacity={ opacity }
                opacitySpread={ 0.1 }
                velocity={ velocity }
                velocitySpread={ velocitySpread }
                color={ color }
                angle={ angle }
                angleSpread={ angleSpread }
                size={ 0.7 }
                sizeSpread={ sizeSpread }
                wiggle={ 0.1 }
                wiggleSpread={ 0.2 }
                particleCount={ Math.min( 40 * defaultMaxLength, 500 ) }
            />
            <SegmentedEmitter
                ref="child"
                maxLength={ defaultMaxLength }
                impulse={ impulse || 100 }
                rayCount={ 2 }
                materialId={ debug ? 'ornateWall1' : 'transparent' }
                position={ position }
                rotation={ rotation }
                scale={ scale }
                helperMaterial={ helperMaterial }
                world={ world }
                paused={ paused }
                time={ time }
                playerRadius={ playerRadius }
                playerBody={ playerBody }
            />
        </group>;

    }

}
