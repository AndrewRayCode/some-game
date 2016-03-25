import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const defaultRotation = new THREE.Quaternion( 0, 0, 0, 1 );
const planeRotation = new THREE.Euler( 0, -THREE.Math.degToRad( 90 ), 0 );
const floorRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );
const floorPosition = new THREE.Vector3( 0, -0.48, 0 );

export default class Dirk extends Component {

    static propTypes = {
        position: PropTypes.object,
        rotation: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string,
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
        const segmentArray = new Array( segments ).fill( 0 );

        return { segmentArray };

    }

    render() {

        const {
            position, rotation, scale, materialId, segments, paddingPercent
        } = this.props;

        const { segmentArray } = this.state;

        // The x scale of the bridge object is used to determine the width of
        // the bridge, while the y (or z) scale represent normal world scaling
        const { x: width, y: size } = scale;

        // Calcualte the width of a plank. Note because we scale the whole
        // thing we don't need to incorporate overall size scale
        const plankWidth = width / segments;

        // Calculate how far from center the leftmost plank should be. Objects
        // are centered so include plankwidth
        const plankStartX = -( width / 2 ) + ( plankWidth / 2 );

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
            { segmentArray.map( ( zero, index ) => <mesh
                    ref={ `mesh${ index }` }
                    scale={ new THREE.Vector3( plankWidth - ( ( paddingPercent * plankWidth ) / 2 ), 1, 0.1 ) }
                    position={ new THREE.Vector3( plankWidth * index + plankStartX, 0, 0.5 ) }
                >
                    <geometryResource
                        resourceId="1x1box"
                    />
                    <materialResource
                        resourceId={ materialId }
                    />
                </mesh>
            )}
        </group>;

    }

}
