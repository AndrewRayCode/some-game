import React, { Component } from 'react';
import THREE from 'three';
import { Text } from '../';

const topScale = new THREE.Vector3( 1, 1, 0.5 ).multiplyScalar( 1.8 );

const bottomPosition = new THREE.Vector3( 1.8, 0, 0 );
const bottomScale = new THREE.Vector3( 1, 1, 0.5 ).multiplyScalar( 0.8 );

export default class Logo extends Component {
    
    static propTypes = {
        fonts: React.PropTypes.object.isRequired,
        letters: React.PropTypes.object.isRequired,
        position: React.PropTypes.object,
        scale: React.PropTypes.object,
    }

    render() {

        const { fonts, letters, position, scale, } = this.props;

        return <object3D
            position={ position }
            scale={ scale }
        >

            <Text
                scale={ topScale }
                fonts={ fonts }
                letters={ letters }
                fontName="Sniglet Regular"
                text="Today"
                materialId="universeInALetter"
            />
            <Text
                position={ bottomPosition }
                scale={ bottomScale }
                fonts={ fonts }
                letters={ letters }
                fontName="Sniglet Regular"
                text="I'm A Galaxy"
                materialId="universeInALetter"
            />

        </object3D>;

    }

}
