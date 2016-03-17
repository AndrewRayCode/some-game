import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SPE from 'shader-particle-engine';

const arrayOrNumber = PropTypes.oneOfType([
    PropTypes.array, PropTypes.number
]);
const arrayOrObject = PropTypes.oneOfType([
    PropTypes.object, PropTypes.number
]);
const defaultPosition = new THREE.Vector3( -0.5, 0, 0 );
const emitterOffset = new THREE.Vector3( 0, -1, 0 );

export default class ParticleEmitter extends Component {

    static propTypes = {
        emitterPosition: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        texture: PropTypes.string.isRequired,
        maxAge: PropTypes.number,
        position: PropTypes.object.isRequired,
        positionSpread: PropTypes.object,
        opacity: arrayOrNumber,
        opacitySpread: PropTypes.number,
        velocity: PropTypes.number.isRequired,
        velocitySpread: PropTypes.object,
        color: arrayOrObject,
        colorSpread: PropTypes.object,
        angle: arrayOrNumber,
        angleRandomise: PropTypes.bool,
        size: arrayOrNumber,
        sizeSpread: PropTypes.object,
        wiggle: PropTypes.number,
        wiggleSpread: PropTypes.number,
        particleCount: PropTypes.number
    }

    constructor() {

        super();
        this._onUpdate = this._onUpdate.bind( this );

    }

    componentDidMount() {

        const {
            positionSpread, rotation, texture, maxAge, opacity,
            opacitySpread, velocity, velocitySpread, color, colorSpread, angle,
            angleRandomise, size, sizeSpread, wiggle, wiggleSpread,
            particleCount,
        } = this.props;

        const particleGroup = this.particleGroup = new SPE.Group({
            texture: { value: texture }
        });
        
        const emitter = this.emitter = new SPE.Emitter({
            maxAge: { value: maxAge },
            position: {
                value: defaultPosition.clone().applyQuaternion( rotation ),
                spread: positionSpread.clone().applyQuaternion( rotation ),
            },
            opacity: {
                value: opacity,
                spread: opacitySpread
            },
            velocity: {
                value: new THREE.Vector3( velocity, 0, 0 ).clone().applyQuaternion( rotation ),
                spread: velocitySpread.clone().applyQuaternion( rotation )
            },
            color: {
                value: color,
                spread: colorSpread
            },
            angle: {
                value: angle,
                randomise: angleRandomise
            },
            size: {
                value: size,
                spread: sizeSpread
            },
            wiggle: {
                value: wiggle,
                spread: wiggleSpread
            },
            particleCount
        });

        particleGroup.addEmitter( emitter );
        this.refs.obj3d.add( particleGroup.mesh );

    }

    componentWillUnmount() {

        this.particleGroup.removeEmitter( this.emitter );
        this.refs.obj3d.remove( this.particleGroup.mesh );

    }

    componentWillReceiveProps( nextProps ) {

        if( this.emitter && (
                nextProps.rotation !== this.props.rotation ||
                nextProps.opacity !== this.props.opacity
            ) ) {

            const {
                rotation, velocity, velocitySpread, opacity, positionSpread
            } = nextProps;

            this.emitter.opacity.value = opacity;
            this.emitter.position.value = defaultPosition.clone().applyQuaternion( rotation );
            this.emitter.position.spread = positionSpread.clone().applyQuaternion( rotation );
            this.emitter.velocity.value = new THREE.Vector3( velocity, 0, 0 ).clone().applyQuaternion( rotation );
            this.emitter.velocity.spread = velocitySpread.clone().applyQuaternion( rotation );

        }

    }

    _onUpdate( elapsedTime, delta ) {

        if( this.particleGroup ) {
            this.particleGroup.tick( delta );
        }

    }

    render() {

        const { emitterPosition, rotation } = this.props;

        return <group
            position={ emitterPosition }
        >
            <object3D
                position={ emitterOffset }
                onUpdate={ this._onUpdate }
                ref="obj3d"
            />
        </group>;

    }

}
