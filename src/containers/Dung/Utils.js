import THREE from 'three';

export function getEntrancesForTube( tube, scaleFactor ) {

    const { position, rotation, type } = tube;

    if( type === 'tube' ) {

        const rotatedQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new THREE.Vector3( 1, 0, 0 )
            .multiplyScalar( scaleFactor )
            .applyQuaternion( rotatedQuaternion );

        const entrance1 = position.clone().add( directionVector );
        const entrance2 = position.clone().sub( directionVector );

        const directionVectorScaled = directionVector
            .clone()
            .multiplyScalar( 0.5 );

        const threshold1 = position.clone().add( directionVectorScaled );
        const threshold2 = position.clone().sub( directionVectorScaled );

        return { tube, entrance1, entrance2, threshold1, threshold2 };

    } else if( type === 'tubebend' ) {

        const rotatedQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new THREE.Vector3( 1, 0, 0 )
            .applyQuaternion( rotatedQuaternion )
            .multiplyScalar( scaleFactor );

        const bentQuaternion = rotation.clone().multiply(
            new THREE.Quaternion().setFromEuler( new THREE.Euler(
                THREE.Math.degToRad( -90 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVectorBent = new THREE.Vector3( 1, 0, 0 )
            .applyQuaternion( bentQuaternion )
            .multiplyScalar( scaleFactor );

        const entrance1 = position.clone().add( directionVector );
        const entrance2 = position.clone().add( directionVectorBent );

        const directionVectorScaled = directionVector
            .clone()
            .multiplyScalar( 0.5 * scaleFactor );

        const bentDirectionVectorScaled = directionVectorBent
            .clone()
            .multiplyScalar( 0.5 * scaleFactor );

        const threshold1 = position.clone().add( directionVectorScaled );
        const threshold2 = position.clone().add( bentDirectionVectorScaled );

        return { tube, entrance1, entrance2, threshold1, threshold2 };

    }

}

export function without( obj, ...keys ) {

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( keys.indexOf( parseFloat( key ) ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

export function lerp( start, target, percent ) {

    return start + percent * ( target - start );

}
