import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRopeRotation = new THREE.Euler( 0, 0, Math.PI / 2 );
const defaultRopePosition = new THREE.Vector3( 0.5, 0, 0 );
const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );
const anchorInsetPercent = 0.1;

export default class PlankBridge extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        plankEntities: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string,
        entityId: PropTypes.string,
        segments: PropTypes.number,
        paddingPercent: PropTypes.number,
    }

    static defaultProps = {
        segments: 4,
        paddingPercent: 0.1
    }

    constructor( props, context ) {

        super( props, context );

        this.state = this.getStateFromProps( props, {} );

    }

    componentWillReceiveProps( nextProps ) {

        if( nextProps.segments !== this.props.segments ) {

            this.setState( this.getStateFromProps( nextProps, this.state ) );

        }

    }

    getStateFromProps( props, state ) {

        const { segments } = props;

        // dam son see http://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
        const segmentArrayWithAnchors = new Array( segments + 1 ).fill( 0 );
        const segmentArray = new Array( segments ).fill( 0 );

        return { segmentArrayWithAnchors, segmentArray };

    }

    render() {

        const {
            position, rotation, scale, materialId, segments, paddingPercent,
            plankEntities, entityId
        } = this.props;

        const { segmentArray, segmentArrayWithAnchors } = this.state;

        // The x scale of the bridge object is used to determine the width of
        // the bridge, while the y (or z) scale represent normal world scaling
        const { x: width, y: size } = scale;

        // Calculate the width of a plank. Note because we scale the whole
        // thing we don't need to incorporate overall size scale
        const plankWidth = width / segments;

        // Calculate how far from center the leftmost plank should be. Objects
        // are centered so include plankwidth
        const plankStartX = -( width / 2 ) + ( plankWidth / 2 );

        const planks = plankEntities && plankEntities[ entityId ];
        let bridge;

        if( planks ) {

            const dorts = [];
            const dangits = [];

            segmentArrayWithAnchors.forEach( ( zero, counter ) => {
                const index = counter - 1;
                const plank = planks[ index ];
                const {
                    position: plankPosition,
                    rotation: plankRotation
                } = plank || {};
                const nextPlank = planks[ index + 1 ];

                const prevAnchor = plank ?
                    new THREE.Vector3(
                        plank.position.x,
                        0,
                        plank.position.z,
                    ) : new THREE.Vector3(
                        -( width * 0.5 ) - ( plankWidth * anchorInsetPercent * 2 ),
                        0,
                        -0.4,
                    );

                const nextAnchor = nextPlank ?
                    new THREE.Vector3(
                        nextPlank.position.x,
                        0,
                        nextPlank.position.z,
                    ) : new THREE.Vector3(
                        ( width * 0.5 ) + ( plankWidth * anchorInsetPercent * 2 ),
                        0,
                        -0.4,
                    );

                if( !plank ) {
                // Before anchor?
                dangits.push(<group
                    key={ index }
                    position={ prevAnchor }
                    scale={ new THREE.Vector3( prevAnchor.distanceTo( nextAnchor ), 0.2, 0.2 ) }
                >
                    <mesh
                        position={ defaultRopePosition }
                        rotation={ defaultRopeRotation }
                    >
                        <geometryResource
                            resourceId="1x1cylinder"
                        />
                        <materialResource
                            resourceId={ 'redDebugMaterial' }
                        />
                    </mesh>
                </group>);
                }

                if( plank ) {

                    dorts.push(
                        <mesh
                            ref={ `mesh${ index }` }
                            key={ index }
                            scale={ new THREE.Vector3( plankWidth - ( paddingPercent * plankWidth ), 1, 0.1 ) }
                            position={ plankPosition }
                            rotation={ plankRotation }
                        >
                            <geometryResource
                                resourceId="1x1box"
                            />
                            <materialResource
                                resourceId={ materialId }
                            />
                        </mesh>
                    );

                }

            } );

            bridge = <group>
                { dangits }
                { dorts }
            </group>;

        } else {

            bridge = segmentArray.map( ( zero, index ) => <mesh
                key={ index }
                ref={ `mesh${ index }` }
                scale={ new THREE.Vector3( plankWidth - ( paddingPercent * plankWidth ), 1, 0.1 ) }
                position={ new THREE.Vector3( plankWidth * index + plankStartX, 0, -0.4 ) }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh> );

        }

        return <group
            position={ position }
            quaternion={ rotation || defaultRotation }
            scale={ new THREE.Vector3( size, size, size ) }
        >
            {/* for selectability */}
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
            { bridge }
        </group>;

    }

}
