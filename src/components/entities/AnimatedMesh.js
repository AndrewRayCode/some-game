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
        animations: PropTypes.object.isRequired,
        animationPercent: PropTypes.number,
    };

    constructor() {

        super();

        this._onUpdate = this._onUpdate.bind( this );
        this.updateAnimations = this.updateAnimations.bind( this );

    }

    componentDidMount() {

        const {
            assets, texture, imageValue, meshName, animations
        } = this.props;
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

        // See https://github.com/mrdoob/three.js/issues/8673
        texture.side = THREE.DoubleSide;

        skinnedMesh.material.skinning = true;
        this.skinnedMesh = skinnedMesh;

        const mixer = new THREE.AnimationMixer( skinnedMesh );
        mixer.stopAllAction();

        console.log('created mixer',mixer);
        meshGroup.add( skinnedMesh );

        // Create the animations
        for( let i = 0; i < geometry.animations.length; i++ ) {

            mixer.clipAction( geometry.animations[ i ] ).setEffectiveWeight( 1 ).play();
            console.log('starting animation', mixer.clipAction( geometry.animations[ i ] ));

        }

        this.mixer = mixer;

        this.updateAnimations( animations );

    }

    updateAnimations( animations ) {

        const { mixer, } = this;

        if( mixer && animations ) {

            for( const animationName in animations ) {

                const data = animations[ animationName ];
                const { weight, percent, } = data;
                //let { percent, weight } = data;
                const action = mixer.clipAction( animationName );

                if( action ) {

                    //if( animationName === 'Idle' ) {
                        //weight = 0;
                        //percent = 0;
                    //} else if( animationName === 'Jump' ) {
                        //weight = 1;
                        //percent = 1;
                    //} else if( animationName === 'Walk' ) {
                        //weight = 0;
                        //percent = 0;
                    //}

                    //action.setEffectiveWeight( weight );
                    //action.weight = weight;
                    //action._effectiveWeight = weight;

                    //const { duration } = action._clip;
                    //action._loopCount = -1;
                    //action._startTime = null;
                    //action.time = Math.min(
                        //duration * 0.99999,
                        //duration * percent
                    //);

                    //action._update( action.time * 3.3, 0 );

                    //0.791667
                    //action.time = 0.891667 * 1000;
                    //action.time = Date.now() * 0.00000001;

                } else {
                    console.warn( `No action "${animationName}" found in mesh ${this.props.meshName}` );
                }

            }

            if( global.xxx ) {
                console.log('RESETTIG WEIGHT ON IDLE');
                mixer.clipAction( 'Open Mouth' ).setEffectiveWeight( 1 ).play();
            
            //.setEffectiveWeight(1).play();
                window.xxx = false;
                global.xxx = false;
            }
            //mixer.update( Date.now() * 0.00000000000001 );
            //mixer.update( 1e-20 );

        }

    }

    componentWillReceiveProps( nextProps ) {

        const{ animations } = nextProps;

        if( animations !== this.props.animations  ) {

            this.updateAnimations( animations );

        }

    }

    componentWillUnmount() {

        const { mixer, skinnedMesh } = this;
        const { meshGroup } = this.refs;
        const { assets, meshName, animations, } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;

        console.log('teardown');

        mixer.stopAllAction();

        // Create the animations
        for( const animationName in animations ) {

            console.log( 'uncaching',animationName );
            const action = mixer.clipAction( animationName );
            mixer.uncacheClip( action._clip );
            mixer.uncacheAction( action, skinnedMesh );

        }

        mixer.uncacheRoot( skinnedMesh );

        meshGroup.remove( skinnedMesh );

    }

    _onUpdate( delta, ealpsedTime ) {

        const { mixer } = this;
        mixer.update( delta * 0.00000001 );

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
