import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class AnimatedMesh extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        assets: PropTypes.object.isRequired,
        texture: PropTypes.object.isRequired,
        imageValue: PropTypes.string,
        meshName: PropTypes.string.isRequired,
        animationWeights: PropTypes.object.isRequired,
        animationPercent: PropTypes.number,
    };

    constructor() {

        super();

        this._onUpdate = this._onUpdate.bind( this );
        this.updateWeights = this.updateWeights.bind( this );

    }

    componentDidMount() {

        const { assets, texture, imageValue, meshName, } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;
        const { meshGroup } = this.refs;

        const skinnedMesh = new THREE.SkinnedMesh(
            geometry,
            texture
        );

        if( imageValue ) {
            texture.uniforms.image.value = imageValue;
        }

        skinnedMesh.material.skinning = true;
        this.skinnedMesh = skinnedMesh;

        const mixer = new THREE.AnimationMixer( skinnedMesh );

        // Create the animations
        for( let i = 0; i < geometry.animations.length; ++i ) {

            mixer.clipAction( geometry.animations[ i ] ).play();

        }

        meshGroup.add( skinnedMesh );
        this.mixer = mixer;

        this.updateWeights( this.props );

    }

    updateWeights( props ) {

        const { animationWeights, } = props;
        const { mixer, } = this;

        if( mixer && animationWeights ) {

            for( const key in animationWeights ) {

                const animation = mixer.clipAction( key );

                if( animation ) {
                    animation.setEffectiveWeight( animationWeights[ key ] );
                }

            }

        }

    }

    componentWillReceiveProps( nextProps ) {

        const{ animationWeights } = nextProps;

        if( animationWeights !== this.props.animationWeights  ) {

            this.updateWeights( nextProps );

        }

    }

    componentWillUnmount() {

        this.refs.meshGroup.remove( this.skinnedMesh );

    }

    _onUpdate( delta, ealpsedTime ) {

        const { mixer } = this;
        const { animationPercent } = this.props;

        if( mixer ) {

            for( let i = 0; i < mixer._actions.length; i++ ) {

                const action = mixer._actions[ i ];
                const { duration } = action._clip;
                action._loopCount = -1;
                action.time = 0;
                action.startTime = 0;
                mixer.update(
                    Math.min(
                        duration * 0.999,
                        duration * ( animationPercent || 0 )
                    )
                );

            }

        }

    }

    render() {

        const { position, rotation, scale, assets, meshName, } = this.props;

        if( !assets[ meshName ] ) {
            return <group />;
        }

        return <group
            onUpdate={ this._onUpdate }
            position={ position }
            rotation={ rotation }
            ref="meshGroup"
            scale={ scale }
        />;

    }

}
