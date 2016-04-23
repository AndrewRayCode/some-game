import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );

export default class MorphTargetMesh extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        assets: PropTypes.object.isRequired,
        texture: PropTypes.object.isRequired,
        meshName: PropTypes.string.isRequired,
        animations: PropTypes.object.isRequired,
        animationPercent: PropTypes.number,
    };

    constructor() {

        super();
        this.updateAnimations = this.updateAnimations.bind( this );

    }

    componentDidMount() {

        const {
            assets, texture, meshName, animations
        } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;
        const { meshGroup } = this.refs;

        const mesh = new THREE.Mesh(
            geometry,
            texture
        );
        meshGroup.add( mesh );
        console.log('meshData in MorphTargetMesh',meshData);

        //mesh.material.skinning = true;
        this.mesh = mesh;

        texture.side = THREE.DoubleSide;

        const mixer = new THREE.AnimationMixer( mesh );

        const clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
        mixer.clipAction( clip ).setDuration( 1 ).play();

        this.clip = clip;
        

        // Create the animations
        //for( let i = 0; i < geometry.animations.length; i++ ) {

            //mixer.clipAction( geometry.animations[ i ] ).play();

        //}

        //this.mixer = mixer;

        //this.updateAnimations( animations );

    }

    updateAnimations( animations ) {

        const { mixer, } = this;

        if( mixer && animations ) {

            //for( const animationName in animations ) {

                //const data = animations[ animationName ];
                //const { weight, percent, } = data;
                //const action = mixer.clipAction( animationName );

                //if( action ) {

                    //action.setEffectiveWeight( weight );

                    //const { duration } = action._clip;
                    //action.time = Math.min(
                        //duration * 0.99999,
                        //duration * percent
                    //);

                //} else {
                    //console.warn( `No action "${animationName}" found in mesh ${this.props.meshName}` );
                //}

            //}

            mixer.update( 0.1 );

        }

    }

    componentWillReceiveProps( nextProps ) {

        const { animations } = nextProps;

        if( animations !== this.props.animations  ) {

            this.updateAnimations( animations );

        }

    }

    componentWillUnmount() {

        const { mixer, mesh } = this;
        const { meshGroup } = this.refs;
        const { assets, meshName, animations, } = this.props;
        const meshData = assets[ meshName ];
        const { geometry } = meshData;

        if( mixer ) {

            mixer.stopAllAction();

            for( const animationName in animations ) {

                const action = mixer.clipAction( animationName );
                mixer.uncacheClip( action._clip );
                mixer.uncacheAction( action, mesh );

            }

            mixer.uncacheRoot( mesh );

               }

        if( mesh ) {

             meshGroup.remove( mesh );

        }

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
