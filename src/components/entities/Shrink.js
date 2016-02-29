import React, { Component } from 'react';
import THREE from 'three';

const rotationOffset = new THREE.Euler( Math.PI / 2, 0, 0 );

export default class Shrink extends Component {

    constructor( props, context ) {
        super( props, context );
    }

    render() {

        const { position, rotation, scale, materialId, wrapMaterialId, time } = this.props;

        return <group
            rotation={ rotation ? new THREE.Euler().setFromQuaternion( rotation
                .clone().multiply( new THREE.Quaternion()
                    .setFromEuler( new THREE.Euler(
                        0,
                        THREE.Math.degToRad( time * 0.1 ),
                        0
                    ) )
                )
            ) : null }
            position={ position }
            scale={ scale }
        >
            <mesh
                scale={ new THREE.Vector3( 0.7, 0.7, 0.7 ) }
                rotation={ rotationOffset }
                ref="mesh2"
            >
                <geometryResource
                    resourceId="planeGeometry"
                />
                <materialResource
                    resourceId={ materialId }
                />
            </mesh>
            <mesh
                rotation={ new THREE.Euler().setFromQuaternion( rotation
                    .clone().multiply( new THREE.Quaternion()
                        .setFromEuler( new THREE.Euler(
                            THREE.Math.degToRad( time * 0.05 ),
                            0,
                            0
                        ) )
                    )
                ) }
                ref="mesh"
            >
                <geometryResource
                    resourceId="sphereGeometry"
                />
                <materialResource
                    resourceId={ wrapMaterialId }
                />
            </mesh>
        </group>;

    }

}
