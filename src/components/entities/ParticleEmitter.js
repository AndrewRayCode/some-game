import React, { Component, PropTypes } from 'react';
import { Vector3, Euler, Color, Quaternion, } from 'three';
import SPE from 'shader-particle-engine';
import { str2Hex } from '../../helpers/Utils';

const arrayOrNumber = PropTypes.oneOfType([
     PropTypes.number
]);
const defaultPosition = new Vector3( -0.4, 0, 0 );
const emitterOffset = new Vector3( 0, -1, 0 );
const emptyQuaternion = new Quaternion( 0, 0, 0, 1 );

export default class ParticleEmitter extends Component {

    static propTypes = {
        type: PropTypes.number,
        scale: PropTypes.number,
        emitterPosition: PropTypes.object.isRequired,
        emitterRadius: PropTypes.number,
        rotation: PropTypes.object.isRequired,
        rotationAxis: PropTypes.object,
        rotationAngle: PropTypes.number,
        texture: PropTypes.string.isRequired,
        maxAge: PropTypes.number,
        positionSpread: PropTypes.object.isRequired,
        opacity: arrayOrNumber,
        opacitySpread: PropTypes.number,
        velocity: PropTypes.number,
        velocityDistribution: PropTypes.number,
        velocityV3: PropTypes.object,
        velocitySpread: PropTypes.object.isRequired,
        colors: PropTypes.array.isRequired,
        colorSpread: PropTypes.object,
        angle: arrayOrNumber,
        angleSpread: PropTypes.number,
        size: arrayOrNumber,
        sizeSpread: arrayOrNumber,
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

    componentWillReceiveProps( nextProps:Object ) {

        const {
            rotation, velocity, velocitySpread, opacity, positionSpread,
            maxAge, angle, angleSpread, colors, size, type, emitterRadius,
            velocityV3, rotationAxis, rotationAngle, velocityDistribution,
            enabled, colorSpread
        } = nextProps;

        if( this.emitter ) {
            if(
                type !== this.props.type ||
                velocity !== this.props.velocity ||
                rotation !== this.props.rotation ||
                colors !== this.props.colors ||
                velocitySpread !== this.props.velocitySpread ||
                positionSpread !== this.props.positionSpread ||
                colorSpread !== this.props.colorSpread ||
                opacity !== this.props.opacity ||
                size !== this.props.size ||
                angle !== this.props.angle ||
                angleSpread !== this.props.angleSpread ||
                emitterRadius !== this.props.emitterRadius ||
                rotationAxis !== this.props.rotationAxis ||
                rotationAngle !== this.props.rotationAngle ||
                maxAge !== this.props.maxAge ||
                velocityV3 !== this.props.velocityV3 ||
                velocityDistribution !== this.props.velocityDistribution
            ) {

                this.tearDownEmitter();
                this.createEmitter( nextProps );

            }

            if( enabled === false ) {

                this.emitter.disable();

            }

        }

    }

    createEmitter( props:Object ) {

        const {
            positionSpread, scale, rotation, quaternion, texture, maxAge,
            opacity, opacitySpread, velocity, velocitySpread, colors,
            colorSpread, angle, angleSpread, size, sizeSpread, wiggle,
            wiggleSpread, particleCount, type, emitterRadius, velocityV3,
            rotationAxis, rotationAngle, velocityDistribution,
        } = props;

        const rotationQuaternion = rotation ?
            new Quaternion().setFromEuler( rotation ) :
            ( quaternion || emptyQuaternion );

        const particleGroup = new SPE.Group({
            texture: { value: texture },
            alphaTest: 0.001
        });
        
        const emitter = new SPE.Emitter({
            type,
            maxAge: { value: maxAge },
            position: {
                value: defaultPosition.clone().applyQuaternion( rotationQuaternion ).multiplyScalar( scale ),
                spread: positionSpread.clone().applyQuaternion( rotationQuaternion ).multiplyScalar( scale ),
                radius: emitterRadius,
            },
            opacity: {
                value: opacity,
                spread: opacitySpread
            },
            velocity: {
                value: (
                    velocityV3 || new Vector3( velocity, 0, 0 ).clone().applyQuaternion( rotationQuaternion )
                ),
                spread: velocitySpread.clone().applyQuaternion( rotationQuaternion ),
                distribution: velocityDistribution,
            },
            color: {
                value: colors.map( c => new Color(
                    typeof c === 'string' ? str2Hex( c ) : c
                ) ),
                spread: colorSpread
            },
            rotation: {
                axis: rotationAxis,
                angle: rotationAngle,
            },
            angle: {
                value: angle,
                spread: angleSpread
            },
            size: {
                value: size * scale,
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

        const { emitterPosition, } = this.props;

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
