import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Eye, ParticleEmitter } from '../';

const defaultScale = new THREE.Vector3( 2, 2, 2 );
const localPlayerRotation = new THREE.Euler( -Math.PI / 2, 0, 0 );
const localEyeRotation = new THREE.Euler( -Math.PI / 2 - 0.2, -Math.PI / 2, 0 );
const eyeScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 0.5 );

const leftEyePosition = new THREE.Vector3( -0.3, 0.2, -0.3 );
const rightEyePosition = leftEyePosition.clone().setX( -leftEyePosition.x );

const particlePosition = new THREE.Vector3( 0, 0, 0 );
const particleRotation = new THREE.Quaternion( 0, 0, 0, 1 )
    .setFromEuler( new THREE.Euler( 0, Math.PI / 2, 0 ) );
const particlePositionSpread = new THREE.Vector3( 1, 1, 1 );
const particleVelocitySpread = new THREE.Vector3( 0, 0, 0 );
const particleColors = [ 0xaaddff, 0xddccff ];
const particleSize = 0.1;

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
            computedScale: scale ?
                defaultScale.clone().multiply( scale ) :
                defaultScale.clone().multiplyScalar( radius )
        };

    }

    render() {

        const {
            position, rotation, quaternion, radius, materialId, time, assets,
        } = this.props;

        const { computedScale, particleMaterial } = this.state;

        return <group
            ref="mesh"
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
            scale={ computedScale }
        >
            <ParticleEmitter
                texture={ particleMaterial }
                position={ particlePosition }
                rotation={ particleRotation }
                positionSpread={ particlePositionSpread }
                type="disc"
                maxLength={ 2 }
                velocity={ 1 }
                velocitySpread={ particleVelocitySpread }
                colors={ particleColors }
                size={ particleSize }
            />
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
        </group>;

    }

}
