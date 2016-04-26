import React, { Component, PropTypes } from 'react';
import THREE, { Euler, Vector3, Quaternion } from 'three';
import SPE from 'shader-particle-engine';
import { Mesh, AnimatedMesh, Eye, ParticleEmitter } from '../';
import shaderFrog from 'helpers/shaderFrog';
import { Animation, AnimationHandler } from 'three-animation-handler';
import { twinkleMaterial } from 'ThreeMaterials';
import Mediator from 'helpers/Mediator';

const lidLocalScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.73 );
const lidLocalRotation = new THREE.Euler( 0, Math.PI / 2, 0 );

const defaultScale = new Vector3( 2, 2, 2 );
const headScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.5 );
const headPosition = new Vector3( 0, 0, -0.15 );
const headRotation = new Euler( -Math.PI / 2, 0, 0 );

const legRotation = new Euler( -Math.PI / 2, 0, 0 );

const jointRotation = new Euler( 0, 0, 0 );
const legPosition = new Vector3( 0, -0.1, 0.31 );
const legScale = new Vector3( 1, 1, 1 ).multiplyScalar( 1.05 );

const defaultTailRotation = new Euler( 0, 0, THREE.Math.degToRad( 60 ) );
const defaultTailPosition = new Vector3( 0.3, -0.42, -0.5 );
const tailScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.9 );

const localEyeRotation = new Euler( -Math.PI / 2 - 0.2, -Math.PI / 2, 0 );
const eyeScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.36 );
const leftEyePosition = new Vector3(
    -0.25,
    0.13,
    -0.19 + headPosition.z,
);
const rightEyePosition = leftEyePosition.clone().setX( -leftEyePosition.x );

const particleVelocityDistribution = SPE.distributions.BOX;
const particleRotationAxis = new Vector3( 0, 0, 1 );
const particleRotationAngle = 10;
const particleOpacity = [ 0.2, 1, 0 ];
const particleVelocity = new Vector3( 0, 0, -1 );
const particleVelocitySpread = new Vector3( 0, 0, 0 );
const particleParticleRotation = [ -1, 1 ];
const particleParticleRotationSpread = [ -1, 1 ];

const particlePositionSpread = new Vector3( 0.8, 0, 0.8 );

const particleRotation = new Quaternion( 0, 0, 0, 1 )
    .setFromEuler( new Euler( 0, Math.PI / 2, 0 ) );
const particleColors = [ 0x4433ff, 0xddbbff ];
const colorSpread = new Vector3( 0.6, 0.4, 0.2 );
const particleSize = 0.4;
const particleSizeSpread = [ 0.4, 2 ];
const particleCount = 50;
const emitterRadius = 2.4;
const emitterMinimumRadius = 0.07;

export default class Player extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        quaternion: PropTypes.object,
        scaleEffectsVisible: PropTypes.bool,
        scaleEffectsEnabled: PropTypes.bool,
        scale: PropTypes.object,
        leftEyeRotation: PropTypes.object,
        rightEyeRotation: PropTypes.object,
        leftLidRotation: PropTypes.object,
        rightLidRotation: PropTypes.object,
        eyeMorphTargets: PropTypes.array,
        legAnimations: PropTypes.object,
        tailAnimations: PropTypes.object,
        tailRotation: PropTypes.object,
        tailPosition: PropTypes.object,
        headAnimations: PropTypes.object,
        materialId: PropTypes.string.isRequired,
        playerTexture: PropTypes.string,
        playerTextureLegs: PropTypes.string,
        playerTextureTail: PropTypes.string,
        assets: PropTypes.object.isRequired,
        radius: PropTypes.number.isRequired,
        time: PropTypes.number,
    };

    constructor( props, context ) {

        super( props, context );

        this.state = this._getStateFromProps( props, true );

    }

    componentWillReceiveProps( nextProps ) {

        if( ( nextProps.radius !== this.props.radius ) ||
           ( nextProps.scale !== this.props.scale )
        ) {
            this.setState( this._getStateFromProps( nextProps ) );
        }

    }

    _getStateFromProps( props, forceUpdate ) {

        const { scale, radius, materialId, playerTexture } = props;

        const newState = {
            computedScale: scale ?
                defaultScale.clone().multiply( scale ) :
                defaultScale.clone().multiplyScalar( radius )
        };

        if( forceUpdate || ( radius !== this.props.radius ) ) {

            newState.positionSpread = particlePositionSpread
                .clone()
                .multiplyScalar( radius );
            newState.sizeSpread = particleSizeSpread.map( val => val * radius );

        }

        return newState;

    }

    componentDidUpdate() {

        Mediator.playerMatrix = this.refs.body.refs.meshGroup.matrixWorld;

    }

    render() {

        const {
            position, rotation, quaternion, radius, materialId, time, assets,
            scale, scaleEffectsVisible, scaleEffectsEnabled, leftEyeRotation,
            rightEyeRotation, playerTexture, playerTextureLegs,
            playerTextureTail, legAnimations, headAnimations, tailAnimations,
            leftLidRotation, rightLidRotation, eyeMorphTargets, tailRotation,
            tailPosition
        } = this.props;

        const {
            computedScale, positionSpread, sizeSpread
        } = this.state;

        const emitterPosition = position
            .clone()
            .add(
                new Vector3(
                    0, 3 * radius, 0
                )
            );

        return <group>
            { scaleEffectsVisible ? <ParticleEmitter
                enabled={ scaleEffectsEnabled }
                texture={ twinkleMaterial }
                emitterPosition={ emitterPosition }
                rotation={ particleRotation }
                positionSpread={ positionSpread }
                velocityV3={ particleVelocity }
                velocitySpread={ particleVelocitySpread }
                colors={ particleColors }
                colorSpread={ colorSpread }
                size={ particleSize + ( radius * 0.6 ) }
                sizeSpread={ sizeSpread }
                particleCount={ particleCount }
                type={ SPE.distributions.DISC }
                emitterRadius={ emitterMinimumRadius + ( radius * emitterRadius ) }
                velocityDistribution={ particleVelocityDistribution }
                rotationAxis={ particleRotationAxis }
                rotationAngle={ particleRotationAngle * radius }
                angle={ particleParticleRotation }
                angleSpread={ particleParticleRotationSpread }
                opacity={ particleOpacity }
                maxAge={ 1 }
            /> : null }
            <group
                ref="mesh"
                position={ position }
                quaternion={ quaternion }
                rotation={ rotation }
                scale={ computedScale }
            >
                <group
                    position={ leftEyePosition }
                    rotation={ leftLidRotation }
                    scale={ lidLocalScale }
                >
                    <AnimatedMesh
                        rotation={ lidLocalRotation }
                        assets={ assets }
                        texture={ shaderFrog.get( 'glowTextureLid' ) }
                        morphTargets={ eyeMorphTargets }
                        meshName="eyeLid"
                    />
                </group>
                <group
                    position={ leftEyePosition }
                    rotation={ leftEyeRotation }
                >
                    <Eye
                        scale={ eyeScale }
                        assets={ assets }
                        rotation={ localEyeRotation }
                        mesh="eye"
                        materialId="greenEye"
                    />
                </group>
                <group
                    position={ rightEyePosition }
                    rotation={ rightLidRotation }
                    scale={ lidLocalScale }
                >
                    <AnimatedMesh
                        rotation={ lidLocalRotation }
                        assets={ assets }
                        texture={ shaderFrog.get( 'glowTextureLid' ) }
                        morphTargets={ eyeMorphTargets }
                        meshName="eyeLid"
                    />
                </group>
                <group
                    position={ rightEyePosition }
                    rotation={ rightEyeRotation }
                >
                    <Eye
                        scale={ eyeScale }
                        assets={ assets }
                        rotation={ localEyeRotation }
                        mesh="eye"
                        materialId="greenEye"
                    />
                </group>
                <AnimatedMesh
                    ref="body"
                    rotation={ headRotation }
                    scale={ headScale }
                    position={ headPosition }
                    assets={ assets }
                    texture={ shaderFrog.get( 'glowTextureFace' ) }
                    animations={ headAnimations }
                    meshName="charisma"
                />
                <Mesh
                    rotation={ jointRotation }
                    position={ legPosition }
                    scale={ legScale }
                    assets={ assets }
                    materialId="glowTextureSkin"
                    meshName="charismaJoints"
                />
                <AnimatedMesh
                    rotation={ legRotation }
                    position={ legPosition }
                    scale={ legScale }
                    assets={ assets }
                    texture={ shaderFrog.get( 'glowTextureLegs' ) }
                    meshName="charismaLegs"
                    animations={ legAnimations }
                />
                <AnimatedMesh
                    rotation={ tailRotation || defaultTailRotation }
                    position={ tailPosition || defaultTailPosition }
                    scale={ tailScale }
                    assets={ assets }
                    texture={ shaderFrog.get( 'glowTextureTail' ) }
                    meshName="charismaTail"
                    animations={ tailAnimations }
                />
            </group>
        </group>;

    }

}
