import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SPE from 'shader-particle-engine';

const arrayOrNumber = PropTypes.oneOfType([
    PropTypes.array, PropTypes.number
]);
const arrayOrObject = PropTypes.oneOfType([
    PropTypes.object, PropTypes.number
]);
const defaultPosition = new THREE.Vector3( 0, 0, 0 );

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
        velocity: PropTypes.object,
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
                value: defaultPosition,
                spread: positionSpread
            },
            opacity: {
                value: opacity,
                spread: opacitySpread
            },
            velocity: {
                value: velocity.clone().applyQuaternion( rotation ),
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

            const { rotation, velocity, velocitySpread, opacity } = nextProps;

            this.emitter.opacity.value = opacity;
            this.emitter.velocity.value = velocity.clone().applyQuaternion( rotation );
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

        return <object3D
            onUpdate={ this._onUpdate }
            rotation={ rotation }
            position={ emitterPosition }
            ref="obj3d"
        />;

    }

}
