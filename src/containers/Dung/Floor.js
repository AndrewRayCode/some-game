import React, { Component } from 'react';
import THREE from 'three';
import CustomShaders from './CustomShaders';

const topPosition = new THREE.Vector3( 0, 0.51, 0 );
const topRotation = new THREE.Euler( -THREE.Math.degToRad( 90 ), 0, 0 );

export default class Floor extends Component {

    constructor( props, context ) {

        super( props, context );
        this._checkMaterialToShader = this._checkMaterialToShader.bind( this );

    }

    componentDidUpdate() {

        this._checkMaterialToShader();

    }

    componentDidMount() {

        this._checkMaterialToShader();

    }

    _checkMaterialToShader() {

        const { materialId, shaders } = this.props;
        if( materialId in CustomShaders ) {
            this.refs.mesh2.material = shaders[ materialId ].material;
        }

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
                    resourceId="floorSideMaterial"
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
