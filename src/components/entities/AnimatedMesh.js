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
        meshName: PropTypes.string.isRequired,
        animations: PropTypes.object.isRequired,
        animationPercent: PropTypes.number,
        morphTargets: PropTypes.array,
    };

    constructor() {

        super();
        this.updateAnimations = this.updateAnimations.bind( this );

    }

    componentDidMount() {

        const {
            assets, texture, meshName, animations, morphTargets
        } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;
        const { meshGroup } = this.refs;

        const skinnedMesh = new THREE.SkinnedMesh(
            geometry,
            texture,
        );
        meshGroup.add( skinnedMesh );

        skinnedMesh.material.skinning = true;
        skinnedMesh.material.morphTargets = true;
        skinnedMesh.material.side = THREE.DoubleSide;

        this.skinnedMesh = skinnedMesh;

        const mixer = new THREE.AnimationMixer( skinnedMesh );
        const bakedAnimations = geometry.animations || [];

        // Create the animations
        for( let i = 0; i < bakedAnimations.length; i++ ) {

            mixer.clipAction( bakedAnimations[ i ] ).play();

        }

        this.mixer = mixer;

        this.updateAnimations( animations, morphTargets );

    }

    updateAnimations( animations, morphTargets ) {

        const { mixer, skinnedMesh } = this;

        if( mixer && animations ) {

            for( const animationName in animations ) {

                const data = animations[ animationName ];
                const { weight, percent, } = data;
                const action = mixer.clipAction( animationName );

                if( action ) {

                    action.setEffectiveWeight( weight );

                    const { duration } = action._clip;
                    action.time = Math.min(
                        duration * 0.99999,
                        duration * percent
                    );

                } else {
                    console.warn( `No action "${animationName}" found in mesh ${this.props.meshName}` );
                }

            }

            mixer.update( 0 );

        }

        if( morphTargets && skinnedMesh ) {

            skinnedMesh.morphTargetInfluences = morphTargets;

        }

    }

    componentWillReceiveProps( nextProps ) {

        const { animations, morphTargets } = nextProps;

        if( ( animations !== this.props.animations ) ||
                ( morphTargets !== this.props.morphTargets )
            ) {

            this.updateAnimations( animations, morphTargets );

        }

    }

    componentWillUnmount() {

        const { mixer, skinnedMesh } = this;
        const { meshGroup } = this.refs;
        const { assets, meshName, animations, } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;

        if( mixer && animations ) {

            mixer.stopAllAction();

            for( const animationName in animations ) {

                const action = mixer.clipAction( animationName );
                mixer.uncacheClip( action._clip );
                mixer.uncacheAction( action, skinnedMesh );

            }

            mixer.uncacheRoot( skinnedMesh );

        }

        meshGroup.remove( skinnedMesh );

    }

    render() {

        const { position, rotation, scale, assets, meshName, } = this.props;

        if( !assets[ meshName ] ) {
            return <group />;
        }

        return <group
            position={ position }
            rotation={ rotation }
            ref="meshGroup"
            scale={ scale }
        />;

    }

}
