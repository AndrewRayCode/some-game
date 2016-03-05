import React, { Component } from 'react';
import THREE from 'three';

const rayCount = 4;

const rayArray = new Array( rayCount );
const emitterPosition = new THREE.Vector3( -0.5, 0, 0 );
const emitterScale = new THREE.Vector3( 0.1, 1, 1 );

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

        const { position, rotation, scale, lengths } = this.props;

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

            { rayArray.map( ( zero, index ) =>
                <mesh
                    key={ index }
                    position={ new THREE.Vector3( 0, 0, -0.5 + ( index / rayCount ) * 1.1 ) }
                    scale={ new THREE.Vector3( lengths[ index ], 1, index / rayCount ) }
                >
                    <geometryResource
                        resourceId="1x1plane"
                    />
                    <materialResource
                        resourceId="placeholder"
                    />
                </mesh>
            )}

        </group>;

    }

}
