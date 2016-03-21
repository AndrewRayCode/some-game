import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import p2 from 'p2';
import { v3toP2 } from '../../helpers/Utils';

const bubbleMinSize = 0.5;
const foamGrowSize = 0.3;
const foamGrowSpeed = 5.2;
const foamSpeed = 4.2;
const minimumPercentToShowFoam = 0.9;

// Computed values

const colRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const axis = new THREE.Vector3( 0, -1, 0 );
// Which way the emitter flows by default
const forwardDirection = new THREE.Vector3( 1, 0, 0 );
const helperRotation = new THREE.Euler( 0, -Math.PI / 2, 0 );
const helperPosition = new THREE.Vector3( -0.5, 0, 0 );

const relativeImpulsePoint = [ 0, 0 ];

export default class SegmentedEmitter extends Component {

    static propTypes = {
        position: PropTypes.object.isRequired,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        world: PropTypes.object,
        paused: PropTypes.bool,
        time: PropTypes.number,
        playerRadius: PropTypes.number,
        playerBody: PropTypes.object,
        maxLength: PropTypes.number.isRequired,
        impulse: PropTypes.number.isRequired,
        rayCount: PropTypes.number.isRequired,
        materialId: PropTypes.string.isRequired,
        foamMaterialId: PropTypes.string,
        foam: PropTypes.bool,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = this.getStateFromProps( props, {} );

        this._onUpdate = this._onUpdate.bind( this );

    }

    componentWillReceiveProps( nextProps ) {

        if( ( nextProps.playerRadius !== this.props.playerRadius ) ||
           ( nextProps.rotation !== this.props.rotation ) ||
           ( nextProps.position !== this.props.position )
        ) {

            this.setState( this.getStateFromProps( nextProps, this.state ) );

        }

    }

    getStateFromProps( props, state ) {

        const {
            position, rotation, playerRadius, scale, maxLength, rayCount
        } = props;

        // dam son see http://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
        const rayArray = new Array( rayCount ).fill( 0 );
        const angle = new THREE.Euler().setFromQuaternion( rotation ).y;
        const impulse = ( props.impulse / rayCount ) * ( playerRadius || 0.45 );
        const flowDirection2D = forwardDirection.clone().applyQuaternion( rotation );

        return {
            rayArray,

            // The actual lenghts tweening towards targets
            lengths: state.lengths || rayArray.map( () => 1 ),

            // Where the waterfall should be ideally based on hit test
            lengthTargets: state.lengths || rayArray.map( () => 1 ),

            counter: 0,
            flowDirection2D: new THREE.Vector2( flowDirection2D.x, flowDirection2D.z ),
            hitVectors: rayArray.map( ( zero, index ) => {

                const streamHalfWidth = 0.5 / rayCount;

                // Construct the *local* unrotated vectors that define this
                // stream in local space
                const fromVectorInitial = new THREE.Vector3(
                    // move close to left edge of emitter
                    -0.499,
                    // move toward the back to intersect player
                    -0.5 + ( playerRadius || 0.45 ),
                    // move to rectangle offset by index
                    -0.5 + /* center */( ( 1 / rayCount ) * index ) + streamHalfWidth
                );

                const toVectorInitial = new THREE.Vector3(
                    fromVectorInitial.x + maxLength,
                    fromVectorInitial.y,
                    fromVectorInitial.z,
                );

                // Calculate the initial two points for the hit test rectangle
                // to do box test on. These are world points
                const a = fromVectorInitial
                    .clone()
                    .sub( new THREE.Vector3( 0, 0, streamHalfWidth ) )
                    .applyQuaternion( rotation )
                    .add( position );

                const b = fromVectorInitial
                    .clone()
                    .add( new THREE.Vector3( 0, 0, streamHalfWidth ) )
                    .applyQuaternion( rotation )
                    .add( position );

                const startingPoints = {
                    a: new THREE.Vector2( a.x, a.z ),
                    b: new THREE.Vector2( b.x, b.z ),
                };

                // Note, these are all in world space except for the impulse
                return {
                    fromVector: v3toP2(
                        fromVectorInitial.applyQuaternion( rotation ).add( position )
                    ),
                    toVector: v3toP2(
                        toVectorInitial.applyQuaternion( rotation ).add( position )
                    ),
                    impulseVector: v3toP2(
                        new THREE.Vector3( impulse, 0, 0 ).applyQuaternion( rotation )
                    ),
                    startingPoints,
                };

            })
        };

    }

    _onUpdate() {
        
        const {
            world, position, paused, playerBody, playerRadius, maxLength
        } = this.props;

        const {
            counter,
            rayArray,
            lengths: oldLengths,
            lengthTargets: oldLengthTargets,
            hitVectors,
            flowDirection2D
        } = this.state;

        if( !world || paused ) {
            return;
        }

        const playerBox = new THREE.Box2().setFromCenterAndSize(
            new THREE.Vector2( playerBody.position.x, playerBody.position.z ),
            new THREE.Vector2( playerRadius * 1.9, playerRadius * 1.9 ),
        );

        let lengthTargets = oldLengthTargets;

        lengthTargets = rayArray.map( ( zero, index ) => {

            const {
                fromVector2D, toVector2D, impulseVector2D, startingPoints
            } = hitVectors[ index ];

            const ray = new p2.Ray({
                mode: p2.Ray.CLOSEST,
                from: fromVector2D,
                to: toVector2D,
            });

            const result = new p2.RaycastResult();
            world.raycast( result, ray );

            const { body } = result;
            const distance = result.getHitDistance( ray );
            let hitLength;

            if( body ) {

                if( body !== playerBody ) {

                    const { mass, position: bodyPosition, } = body;
                    if( mass ) {
                        body.applyImpulse( impulseVector2D, relativeImpulsePoint );
                        //body.velocity.x += impulseVector.x;
                        //body.velocity.z += impulseVector.z;
                    }

                }
                hitLength = distance;

            } else {

                hitLength = maxLength;

            }

            const { a, b } = startingPoints;

            const points = [ a, b,
                a.clone().add( flowDirection2D.clone().multiplyScalar( hitLength * 1.1 ) ),
                b.clone().add( flowDirection2D.clone().multiplyScalar( hitLength * 1.1 ) )
            ];

            const box = new THREE.Box2().setFromPoints( points );

            if( box.intersectsBox( playerBox ) ) {

                playerBody.applyImpulse( impulseVector2D, relativeImpulsePoint );
                //playerBody.velocity.x += impulseVector.x;
                //playerBody.velocity.z += impulseVector.z;
                hitLength = Math.min(
                    body === playerBody ?
                        hitLength :
                        p2.vec2.distance( fromVector2D, playerBody.position ),
                    maxLength
                );

            }

            return hitLength;

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

    render() {

        const {
            position, rotation, scale, time, materialId, playerRadius,
            foamMaterialId, rayCount, foam, helperMaterial, debug
        } = this.props;
        const { lengths, lengthTargets, rayArray, } = this.state;
        const waterfallHeight = -0.5 + ( playerRadius || 0.45 );

        return <group><group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
            onUpdate={ this._onUpdate }
        >
            <mesh
                ref="mesh"
                position={ helperPosition }
                rotation={ helperRotation }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId={ helperMaterial || 'transparent' }
                />
            </mesh>
            <mesh
                ref="mesh"
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="transparent"
                />
            </mesh>

            {/* Foam */}
            { foam ? rayArray.map( ( zero, index ) => {

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
                            resourceId={ foamMaterialId || 'waterFoam' }
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
                            resourceId={ foamMaterialId || 'waterFoam' }
                        />
                    </mesh>
                </group>;

            }) : null }

            {/* Emitters */}
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

        </group>

        { debug ? <mesh
            position={this.state.hitVectors[0].toVector}
            scale={ new THREE.Vector3( 0.5, 6, 0.5 ) }
        >
            <geometryResource
                resourceId="radius1sphere"
            />
            <materialResource
                resourceId="entranceMaterial"
            />
        </mesh> : null }
        { debug ? <mesh
            position={this.state.hitVectors[0].fromVector}
            scale={ new THREE.Vector3( 0.5, 6, 0.5 ) }
        >
            <geometryResource
                resourceId="radius1sphere"
            />
            <materialResource
                resourceId="exitMaterial"
            />
        </mesh> : null }
        </group>;


    }

}
