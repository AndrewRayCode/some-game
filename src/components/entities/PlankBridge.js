import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const ropeWidth = 0.05;
const ropeSeparation = 0.45;
const defaultRopeRotation = new THREE.Euler( 0, 0, Math.PI / 2 );
const defaultRopePosition1 = new THREE.Vector3( 0.5, -ropeSeparation / ropeWidth, 0 );
const defaultRopePosition2 = new THREE.Vector3( 0.5, ropeSeparation / ropeWidth, 0 );
const anchorInsetPercent = 0.1;
const ropeVector = new THREE.Vector3( 1, 0, 0 );

export default class PlankBridge extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        plankEntities: PropTypes.object,
        anchorEntities: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string,
        ropeMaterialId: PropTypes.string,
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
            position, rotation, quaternion, scale, materialId, segments,
            paddingPercent, plankEntities, anchorEntities, entityId,
            ropeMaterialId
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
        const constraints = anchorEntities && anchorEntities[ entityId ];
        let bridge;

        if( planks ) {

            const plankMeshes = [];
            const ropeMeshes = [];

            segmentArrayWithAnchors.forEach( ( zero, index ) => {

                const constraint = constraints[ index ];
                const { positionA, positionB } = constraint || {};

                const plank = planks[ index - 1 ];
                const {
                    position: plankPosition,
                    rotation: plankRotation
                } = plank || {};

                const nextPlank = planks[ index ];

                const subbed = positionB.clone().sub( positionA );

                ropeMeshes.push(<group
                    key={ index }
                    position={ positionA }
                    rotation={ new THREE.Euler(
                        0,
                        ropeVector.angleTo( subbed ) * ( positionB.z > positionA.z ? -1 : 1 ),
                        0,
                    ) }
                    scale={ new THREE.Vector3(
                        positionA.distanceTo( positionB ), 0.05, 0.05
                    ) }
                >
                    <mesh
                        position={ defaultRopePosition1 }
                        rotation={ defaultRopeRotation }
                    >
                        <geometryResource
                            resourceId="1x1cylinder"
                        />
                        <materialResource
                            resourceId={ ropeMaterialId }
                        />
                    </mesh>
                    <mesh
                        position={ defaultRopePosition2 }
                        rotation={ defaultRopeRotation }
                    >
                        <geometryResource
                            resourceId="1x1cylinder"
                        />
                        <materialResource
                            resourceId={ ropeMaterialId }
                        />
                    </mesh>
                </group>);

                if( plank ) {

                    plankMeshes.push(
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
                { ropeMeshes }
                { plankMeshes }
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
            quaternion={ quaternion }
            rotation={ rotation }
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
