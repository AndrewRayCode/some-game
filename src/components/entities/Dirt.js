import React, { Component } from 'react';
import THREE from 'three';

const rayCount = 4;

// dam son see http://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
const rayArray = new Array( rayCount ).fill( 0 );
const emitterPosition = new THREE.Vector3( -0.5, 0, 0 );
const emitterScale = new THREE.Vector3( 0.1, 1, 1 );
const colRotation = new THREE.Euler( Math.PI / 2, 0 );

export default class Dirt extends Component {

    constructor( props, context ) {

        super( props, context );
        this.state = {
            lengths: rayArray.map( () => 1 ),
            counter: 0,
        };
        this._onUpdate = this._onUpdate.bind( this );

    }

    _onUpdate() {
        
        let { counter } = this.state;
        counter++;

        this.setState({ counter});

    }

    render() {

        const { position, rotation, scale, } = this.props;
        const { lengths } = this.state;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
            onUpdate={ this._onUpdate}
        >
            <mesh
                ref="mesh"
                position={ emitterPosition }
                scale={ emitterScale }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="placeholder"
                />
            </mesh>

            { rayArray.map( ( zero, index ) => {
                return <mesh
                    key={ index }
                    position={ new THREE.Vector3(
                        -0.5 + ( lengths[ index ] / 2 ),
                        0,
                        -0.5 + ( ( 1 / rayCount ) * index ) + ( 0.5 / rayCount )
                    ) }
                    scale={ new THREE.Vector3(
                        lengths[ index ],
                        1 / rayCount,
                        1,
                    ) }
                    rotation={ colRotation }
                >
                    <geometryResource
                        resourceId="1x1plane"
                    />
                    <materialResource
                        resourceId={index % 2 ? 'placeholder' : 'placeholder2'}
                    />
                </mesh>;
            })}

        </group>;

    }

}
