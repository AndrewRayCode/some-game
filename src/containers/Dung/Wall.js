import React, { Component } from 'react';
import THREE from 'three';
import { connect } from 'react-redux';

const topPosition = new THREE.Vector3( 0, 0.51, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

@connect(
    state => ({ spaceCubeWall: state.shaders.spaceCubeWall.material })
)
export default class Wall extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    componentDidMount() {

        console.log('material',this.props.spaceCubeWall);
        this.refs.mesh2.material = this.props.spaceCubeWall;

    }

    render() {

        const { position, rotation, scale, materialId, time } = this.props;

        return <group
            position={ position }
            quaternion={ rotation || new THREE.Quaternion( 0, 0, 0, 1 ) }
            scale={ scale }
        >
            <mesh
                ref="mesh"
                position={ topPosition }
                rotation={ topRotation }
            >
                <geometryResource
                    resourceId="planeGeometry"
                />
                <materialResource
                    resourceId="wallSideMaterial"
                />
            </mesh>
            <mesh
                ref="mesh2"
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
        </group>;

    }

}
