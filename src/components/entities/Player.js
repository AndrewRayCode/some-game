import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import SPE from 'shader-particle-engine';
import { Eye, ParticleEmitter } from '../';

const defaultScale = new THREE.Vector3( 2, 2, 2 );
const localPlayerRotation = new THREE.Euler( -Math.PI / 2, 0, 0 );
const localEyeRotation = new THREE.Euler( -Math.PI / 2 - 0.2, -Math.PI / 2, 0 );
const eyeScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.5 );

const leftEyePosition = new THREE.Vector3( -0.3, 0.2, -0.3 );
const rightEyePosition = leftEyePosition.clone().setX( -leftEyePosition.x );

const particleVelocityDistribution = SPE.distributions.BOX;
const particleRotationAxis = new THREE.Vector3( 0, 0, 1 );
const particleRotationAngle = 5;
const particleOpacity = [ 0, 1, 1, 1, 1, 0 ];
const particleVelocity = new THREE.Vector3( 0, 0, -1 );
const particleVelocitySpread = new THREE.Vector3( 0, 0, 0 );

const particlePositionSpread = new THREE.Vector3( 0.8, 0, 0.8 );

const particleRotation = new THREE.Quaternion( 0, 0, 0, 1 )
    .setFromEuler( new THREE.Euler( 0, Math.PI / 2, 0 ) );
const particleColors = [ 0xaaddff, 0xddccff ];
const particleSize = 0.2;
const particleCount = 100;
const emitterRadius = 0.6;

export default class Player extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        quaternion: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string,
        assets: PropTypes.object,
        radius: PropTypes.number,
        time: PropTypes.number,
    };

    constructor( props, context ) {

        super( props, context );

        this.state = {
            ...this._getStateFromProps( props ),
            particleMaterial: __CLIENT__ ? THREE.ImageUtils.loadTexture(
                require( '../../../assets/twinkle-particle.png' )
            ) : null,
        };

    }

    componentWillReceiveProps( nextProps ) {

        if( ( nextProps.radius !== this.props.radius ) ||
           ( nextProps.scale !== this.props.scale )
        ) {
            this.setState( this._getStateFromProps( nextProps ) );
        }

    }

    _getStateFromProps( props ) {

        const { scale, radius } = props;

        return {
            positionSpread: particlePositionSpread
                .clone()
                .multiplyScalar( radius ),
            computedScale: scale ?
                defaultScale.clone().multiply( scale ) :
                defaultScale.clone().multiplyScalar( radius )
        };

    }

    render() {

        const {
            position, rotation, quaternion, radius, materialId, time, assets,
            scale
        } = this.props;

        const {
            computedScale, particleMaterial, positionSpread
        } = this.state;

        const emitterPosition = position
            .clone()
            .add(
                new THREE.Vector3(
                    0, 3 * radius, 0
                )
            );

        return <group>
            {/*<mesh
                position={ emitterPosition }
                scale={
                    new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.4 * radius )
                }
            >
                <geometryResource
                    resourceId="radius1sphere"
                />
                <materialResource
                    resourceId="redDebugMaterial"
                />
            </mesh>*/}
            <ParticleEmitter
                texture={ particleMaterial }
                emitterPosition={ emitterPosition }
                rotation={ particleRotation }
                positionSpread={ positionSpread }
                maxLength={ radius * 2.5 }
                velocityV3={ particleVelocity }
                velocitySpread={ particleVelocitySpread }
                colors={ particleColors }
                size={ particleSize - ( radius * 0.1 ) }
                particleCount={ particleCount }
                type={ SPE.distributions.DISC }
                emitterRadius={ emitterRadius }
                velocityDistribution={ particleVelocityDistribution }
                rotationAxis={ particleRotationAxis }
                rotationAngle={ particleRotationAngle * radius }
                opacity={ particleOpacity }
                maxAge={ radius * 2.5 }
            />
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
                <mesh
                    rotation={ new THREE.Euler( -Math.PI / 2, time * 0.25, 0, ) }
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId={ materialId }
                    />
                </mesh>
            </group>
        </group>;

    }

}
