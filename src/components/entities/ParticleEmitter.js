import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SPE from 'shader-particle-engine';
import { str2Hex } from '../../helpers/Utils';

const arrayOrNumber = PropTypes.oneOfType([
    PropTypes.array, PropTypes.number
]);
const arrayOrObject = PropTypes.oneOfType([
    PropTypes.object, PropTypes.number
]);
const defaultPosition = new THREE.Vector3( -0.4, 0, 0 );
const emitterOffset = new THREE.Vector3( 0, -1, 0 );

const defaultColor = [
    0xffffff,
    0xdddddd,
];

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
        angleSpread: PropTypes.number,
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

        this.createEmitter( this.props );

    }

    componentWillUnmount() {

        this.tearDownEmitter();

    }

    componentWillReceiveProps( nextProps ) {

        const {
            rotation, velocity, velocitySpread, opacity, positionSpread,
            maxAge, angle, angleSpread, color
        } = nextProps;

        if( this.emitter ) {
            if(
                velocity !== this.props.velocity ||
                rotation !== this.props.rotation ||
                color !== this.props.color ||
                velocitySpread !== this.props.velocitySpread ||
                positionSpread !== this.props.positionSpread ||
                opacity !== this.props.opacity ||
                angle !== this.props.angle ||
                angleSpread !== this.props.angleSpread ||
                maxAge !== this.props.maxAge
            ) {

                this.tearDownEmitter();
                this.createEmitter( nextProps );

            }

        }

    }

    createEmitter( props ) {

        const {
            positionSpread, rotation, texture, maxAge, opacity,
            opacitySpread, velocity, velocitySpread, color, colorSpread, angle,
            angleSpread, size, sizeSpread, wiggle, wiggleSpread,
            particleCount,
        } = props;

        const particleGroup = new SPE.Group({
            texture: { value: texture }
        });
        
        const emitter = new SPE.Emitter({
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
                value: ( color || defaultColor ).map( c => new THREE.Color(
                    typeof c === 'string' ? str2Hex( c ) : c
                ) ),
                spread: colorSpread
            },
            angle: {
                value: angle,
                spread: angleSpread
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

        this.particleGroup = particleGroup;
        this.emitter = emitter;

        this.refs.obj3d.add( particleGroup.mesh );

    }
    
    tearDownEmitter() {

        this.particleGroup.removeEmitter( this.emitter );
        this.refs.obj3d.remove( this.particleGroup.mesh );
        this.particleGroup.dispose();

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
