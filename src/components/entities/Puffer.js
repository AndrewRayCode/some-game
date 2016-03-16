import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SegmentedEmitter from './SegmentedEmitter';
import ParticleEmitter from './ParticleEmitter';

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

        return <group>
            <ParticleEmitter
                rotation={ rotation }
                emitterPosition={ position }
                texture={ THREE.ImageUtils.loadTexture(
                    require( '../../../assets/smoke-particle.png' )
                )}
                maxAge={ 2 }
                positionSpread={ new THREE.Vector3( 0.5, 0, 0.0 ) }
                opacity={[ 0.8, 0 ]}
                opacitySpread={ 0.1 }
                velocity={ new THREE.Vector3( 0, 2, 0 ) }
                velocitySpread={ new THREE.Vector3( 0.1, 0.0, 0.1 ) }
                color={[
                    new THREE.Color( 0xffffff ),
                    new THREE.Color( 0xdddddd ),
                ]}
                angleRandomise
                angle={[ 0, 1 ]}
                size={ 0.6 }
                sizeSpread={ new THREE.Vector3( 0.5, 0.5, 0.5 ) }
                wiggle={ 0.1 }
                wiggleSpread={ 0.2 }
                particleCount={ 50 }
            />
            <SegmentedEmitter
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
            />
        </group>;

    }

}
