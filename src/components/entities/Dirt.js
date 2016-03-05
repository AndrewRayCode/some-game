import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import CANNON from 'cannon/src/Cannon';

const rayCount = 4;
const updateFrameSkipCount = 4;
const maxLength = 10;

// dam son see http://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
const rayArray = new Array( rayCount ).fill( 0 );
const emitterPosition = new THREE.Vector3( -0.5, 0, 0 );
const emitterScale = new THREE.Vector3( 0.1, 1, 1 );
const colRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );

const bubbleMinSize = 0.5;
const bubbleGrowSize = 0.3;
const bubbleGrowSpeed = 2.2;
const foamSpeed = 4.2;

const defaultImpulse = 100.0;

const raycaster = new THREE.Raycaster();

export default class Dirt extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        time: PropTypes.number,
    }

    constructor( props, context ) {

        super( props, context );
        this.state = {
            lengths: rayArray.map( () => 1 ),
            counter: 0,
            impulse: ( props.impulse || defaultImpulse ) / Math.pow( 1 / props.scale.x, 3 )
        };
        this._onUpdate = this._onUpdate.bind( this );

    }

    _onUpdate() {
        
        const { world, position, paused } = this.props;
        const { counter, lengths: oldLengths, impulse } = this.state;

        if( world && !paused ) {

            let lengths = oldLengths;

            if( !( counter % updateFrameSkipCount ) ) {

                lengths = rayArray.map( ( zero, index ) => {
                    const result = new CANNON.RaycastResult();

                    const from = new CANNON.Vec3(
                        position.x - 0.4,
                        position.y,
                        position.z - 0.5 + ( ( 1 / rayCount ) * index ) + ( 0.5 / rayCount )
                    );
                    const to = new CANNON.Vec3(
                        from.x + maxLength,
                        from.y,
                        from.z,
                    );
                    world.rayTest( from, to, result );

                    const { hasHit, body, distance, hitPointWorld } = result;

                    if( hasHit ) {

                        const { mass, position: bodyPosition, } = body;
                        if( mass ) {
                            body.applyImpulse(
                                new CANNON.Vec3( impulse, 0, 0 ),
                                hitPointWorld.clone().vsub( bodyPosition )
                            );
                        }
                        return distance;

                    } else {
                        return maxLength;
                    }

                });

            }

            this.setState({ counter: counter + 1, lengths });
        }

    }

    render() {

        const { position, rotation, scale, time, materialId, } = this.props;
        const { lengths } = this.state;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
            onUpdate={ this._onUpdate }
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
                <group
                    key={ index }
                    position={ new THREE.Vector3(
                        -0.5 + lengths[ index ],
                        0,
                        -0.5 + ( ( 1 / rayCount ) * index ) + ( 0.5 / rayCount ),
                    ) }
                    scale={
                        new THREE.Vector3( 1, 1, 1 ).multiplyScalar( 1 / rayCount )
                    }
                >
                    <mesh
                        position={ new THREE.Vector3(
                            0, 0, -0.25
                        ) }
                        scale={
                            new THREE.Vector3( 1, 1, 1 )
                                .multiplyScalar( bubbleMinSize * 2 + bubbleGrowSize * Math.sin( bubbleGrowSpeed * time * 0.9 + index ) )
                        }
                        rotation={ new THREE.Euler(
                            ( foamSpeed * time - index ) * 0.1,
                            ( foamSpeed * time + index ) * 1.1,
                            foamSpeed * time
                        )}
                    >
                        <geometryResource
                            resourceId="radius1sphere"
                        />
                        <materialResource
                            resourceId={ materialId }
                        />
                    </mesh>
                    <mesh
                        position={ new THREE.Vector3(
                            0, 0, 0.25
                        ) }
                        scale={
                            new THREE.Vector3( 1, 1, 1 )
                                .multiplyScalar( bubbleMinSize * 2 + bubbleGrowSize * Math.cos( bubbleGrowSpeed * time * 1.1 + index ) )
                        }
                        rotation={ new THREE.Euler(
                            ( foamSpeed * time + index ) * 0.6,
                            foamSpeed * time,
                            ( foamSpeed * time + index ) * 1.2,
                        )}
                    >
                        <geometryResource
                            resourceId="radius1sphere"
                        />
                        <materialResource
                            resourceId={ materialId }
                        />
                    </mesh>
                </group>
            )}

            { rayArray.map( ( zero, index ) =>
                <mesh
                    key={ index }
                    position={ new THREE.Vector3(
                        -0.5 + ( lengths[ index ] / 2 ),
                        0,
                        -0.5 + ( ( 1 / rayCount ) * index ) + ( 0.5 / rayCount )
                    ) }
                    scale={ new THREE.Vector3(
                        1 / rayCount,
                        lengths[ index ],
                        1,
                    ) }
                    rotation={ colRotation }
                >
                    <geometryResource
                        resourceId="1x1plane"
                    />
                    <materialResource
                        resourceId={ materialId }
                    />
                </mesh>
            )}

        </group>;

    }

}
