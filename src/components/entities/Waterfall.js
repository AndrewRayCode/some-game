import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import CANNON from 'cannon/src/Cannon';
import { lerp } from '../../helpers/Utils';

const rayCount = 4;
const maxLength = 10;

// dam son see http://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
const rayArray = new Array( rayCount ).fill( 0 );
const emitterPosition = new THREE.Vector3( -0.5, 0, 0 );
const emitterScale = new THREE.Vector3( 0.1, 1, 1 );
const colRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const axis = new THREE.Vector3( 0, 1, 0 );

const bubbleMinSize = 0.5;
const foamGrowSize = 0.3;
const foamGrowSpeed = 5.2;
const foamSpeed = 4.2;

const defaultImpulse = 20.0;

const minimumPercentToShowFoam = 0.9;

const raycaster = new THREE.Raycaster();

export default class Waterfall extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        time: PropTypes.number,
        playerRadius: PropTypes.number,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = {
            lengths: rayArray.map( () => 1 ),
            lengthTargets: rayArray.map( () => 1 ),
            counter: 0,
            impulse: ( props.impulse || defaultImpulse ) / Math.pow( 1 / props.scale.x, 3 ),
            //fromVector, toVector
        };
        this._onUpdate = this._onUpdate.bind( this );

    }

    _onUpdate() {
        
        const { world, position, paused, playerRadius, rotation } = this.props;
        const {
            counter, impulse,
            lengths: oldLengths,
            lengthTargets: oldLengthTargets,
            //fromVector, toVector
        } = this.state;

        const angle = new THREE.Euler().setFromQuaternion( rotation ).y;

        if( world && !paused ) {

            let lengthTargets = oldLengthTargets;

            lengthTargets = rayArray.map( ( zero, index ) => {
                const result = new CANNON.RaycastResult();

                const fromVector = new THREE.Vector3(
                    -0.499,
                    -0.5 + ( playerRadius || 0.45 ),
                    -0.5 + ( ( 1 / rayCount ) * index ) + ( 0.5 / rayCount )
                );

                const toVector = new THREE.Vector3(
                    fromVector.x + maxLength,
                    fromVector.y,
                    fromVector.z,
                );

                world.rayTest(
                    fromVector.applyAxisAngle( axis, angle ).add( position ),
                    toVector.applyAxisAngle( axis, angle ).add( position ),
                    result
                );

                const { hasHit, body, distance, hitPointWorld } = result;

                if( hasHit ) {

                    const { mass, position: bodyPosition, } = body;
                    if( mass ) {
                        body.applyImpulse(
                            new THREE.Vector3( impulse, 0, 0 ).applyAxisAngle( axis, angle ),
                            new CANNON.Vec3( 0, 0, 0 )
                        );
                    }
                    return distance;

                } else {

                    return maxLength;

                }

            });

            const lengths = oldLengths.map( ( length, index ) => {
                const target = lengthTargets[ index ];
                return target > length ? Math.min( length + 0.2, target ) : target;
            });

            this.setState({
                counter: counter + 1,
                lengths, lengthTargets
            });

        }

    }

    render() {

        const {
            position, rotation, scale, time, materialId, playerRadius
        } = this.props;
        const { lengths, lengthTargets } = this.state;
        const waterfallHeight = -0.5 + ( playerRadius || 0.45 );

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
                    resourceId="transparent"
                />
            </mesh>

            {/* Foam */}
            { rayArray.map( ( zero, index ) => {

                const length = lengths[ index ];
                const target = lengthTargets[ index ];
                const percentToTarget = Math.max(
                    ( 1.0 - ( Math.abs( target - length ) / target ) ) - minimumPercentToShowFoam,
                    0
                ) * ( 1 / ( 1 - minimumPercentToShowFoam ) );

                return <group
                    key={ index }
                    position={ new THREE.Vector3(
                        -0.5 + length,
                        waterfallHeight,
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
                                .multiplyScalar(
                                    ( bubbleMinSize * 2 + foamGrowSize * Math.sin( foamGrowSpeed * time * 0.6 - index ) ) *
                                    percentToTarget
                                )
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
                            resourceId="waterFoam"
                        />
                    </mesh>
                    <mesh
                        position={ new THREE.Vector3(
                            0, 0, 0.25
                        ) }
                        scale={
                            new THREE.Vector3( 1, 1, 1 )
                                .multiplyScalar(
                                    ( bubbleMinSize * 2 + foamGrowSize * Math.cos( foamGrowSpeed * time * 1.2 + index ) ) *
                                    percentToTarget
                                )
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
                            resourceId="waterFoam"
                        />
                    </mesh>
                </group>;

            })}

            {/* Waterfalls */}
            { rayArray.map( ( zero, index ) =>
                <mesh
                    key={ index }
                    position={ new THREE.Vector3(
                        -0.5 + ( lengths[ index ] / 2 ),
                        waterfallHeight,
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
