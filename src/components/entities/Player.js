import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SPE from 'shader-particle-engine';
import { Mesh, Eye, ParticleEmitter } from '../';
import shaderFrog from '../../helpers/shaderFrog';
import { Animation, AnimationHandler } from 'three-animation-handler';

const defaultScale = new THREE.Vector3( 2, 2, 2 );
const localPlayerRotation = new THREE.Euler( -Math.PI / 2, 0, 0 );

const localEyeRotation = new THREE.Euler( -Math.PI / 2 - 0.2, -Math.PI / 2, 0 );
const eyeScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.36 );
const leftEyePosition = new THREE.Vector3( -0.25, 0.13, -0.19 );
const rightEyePosition = leftEyePosition.clone().setX( -leftEyePosition.x );

const particleVelocityDistribution = SPE.distributions.BOX;
const particleRotationAxis = new THREE.Vector3( 0, 0, 1 );
const particleRotationAngle = 10;
const particleOpacity = [ 0.2, 1, 0 ];
const particleVelocity = new THREE.Vector3( 0, 0, -1 );
const particleVelocitySpread = new THREE.Vector3( 0, 0, 0 );
const particleParticleRotation = [ -1, 1 ];
const particleParticleRotationSpread = [ -1, 1 ];

const particlePositionSpread = new THREE.Vector3( 0.8, 0, 0.8 );

const particleRotation = new THREE.Quaternion( 0, 0, 0, 1 )
    .setFromEuler( new THREE.Euler( 0, Math.PI / 2, 0 ) );
const particleColors = [ 0x4433ff, 0xddbbff ];
const colorSpread = new THREE.Vector3( 0.6, 0.4, 0.2 );
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
        percentMouthOpen: PropTypes.number,
        materialId: PropTypes.string.isRequired,
        playerTexture: PropTypes.string,
        assets: PropTypes.object.isRequired,
        radius: PropTypes.number.isRequired,
        time: PropTypes.number,
    };

    constructor( props, context ) {

        super( props, context );

        this._onUpdate = this._onUpdate.bind( this );

        this.state = {
            ...this._getStateFromProps( props, true ),
            particleMaterial: __CLIENT__ ? THREE.ImageUtils.loadTexture(
                require( '../../../assets/twinkle-particle.png' )
            ) : null,
        };

    }

    componentDidMount() {

        const { assets } = this.props;
        const { charisma } = assets;
        const { playerGroup } = this.refs;

        const mesh = new THREE.SkinnedMesh(
            charisma.geometry,
            shaderFrog.get( 'glowTexture' )
        );
        shaderFrog.get( 'glowTexture' ).uniforms.image.value = this.props.playerTexture;
        
        mesh.material.skinning = true;

        playerGroup.add( mesh );
        this.playerMesh = mesh;

        const mixer = new THREE.AnimationMixer( mesh );
        mixer.clipAction( mesh.geometry.animations[ 3 ] ).play();
        this.mixer = mixer;

    }

    componentWillUnmount() {

        this.refs.playerGroup.remove( this.playerMesh );

    }

    _onUpdate( delta, ealpsedTime ) {

        if( this.mixer ) {

            //this.mixer.update( 0  );
            this.mixer.time = 0;
            const action = this.mixer._actions[ 0 ];
            const { duration } = action._clip;
            action._loopCount = -1;
            action.time = 0;
            action.startTime = 0;
            this.mixer.update(
                Math.min( duration * 0.999, duration * ( this.props.percentMouthOpen || 0 ) )
            );

        }

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

        if( ( forceUpdate && playerTexture ) || ( playerTexture !== this.props.playerTexture ) ) {

            const material = shaderFrog.get( materialId );

            if( material ) {
                material.uniforms.image.value = this.props.playerTexture;
            }

        }

        return newState;

    }

    render() {

        const {
            position, rotation, quaternion, radius, materialId, time, assets,
            scale, scaleEffectsVisible, scaleEffectsEnabled,
        } = this.props;

        const {
            computedScale, particleMaterial, positionSpread, sizeSpread
        } = this.state;

        const emitterPosition = position
            .clone()
            .add(
                new THREE.Vector3(
                    0, 3 * radius, 0
                )
            );

        return <group
            onUpdate={ this._onUpdate }
        >
            { scaleEffectsVisible ? <ParticleEmitter
                enabled={ scaleEffectsEnabled }
                texture={ particleMaterial }
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
                <Eye
                    scale={ eyeScale }
                    assets={ assets }
                    rotation={ localEyeRotation }
                    position={ leftEyePosition }
                    mesh="eye"
                    materialId="greenEye"
                />
                <Eye
                    scale={ eyeScale }
                    assets={ assets }
                    rotation={ localEyeRotation }
                    position={ rightEyePosition }
                    mesh="eye"
                    materialId="greenEye"
                />
                <group
                    ref="playerGroup"
                    scale={ new THREE.Vector3( 0.5, 0.5, 0.5 ) }
                />
            </group>
        </group>;

    }

}
