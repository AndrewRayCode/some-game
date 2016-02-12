import THREE from 'three';

// Garbage library https://github.com/sohamkamani/three-object-loader/issues/1
import mutateThreeWithObjLoader from 'three-obj-loader';
mutateThreeWithObjLoader( THREE );

export function cubeToPlayerCollision( entityA, player, radius ):boolean {

    const positionA = entityA.position;
    const scaleA = entityA.scale;

    const positionB = player.position;
    const sizeB = radius * 2;

    if( Math.abs( positionA.x - positionB.x ) < scaleA.x + sizeB ) {
        if( Math.abs( positionA.y - positionB.y ) < scaleA.y + sizeB ) {
            if( Math.abs( positionA.z - positionB.z ) < scaleA.z + sizeB ) {
                return true;
            }
        }
    }

    return false;

}

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
            .multiplyScalar( 0.5 );

        const bentDirectionVectorScaled = directionVectorBent
            .clone()
            .multiplyScalar( 0.5 );

        const threshold1 = position.clone().add( directionVectorScaled );
        const threshold2 = position.clone().add( bentDirectionVectorScaled );

        const average = entrance1.clone()
            .add( entrance2 )
            .multiplyScalar( 0.5 );

        // Since I don't know how to / am currently too lazy to figure out how
        // to do arc math to calculate the midpoint of the arc of a bent tube,
        // this formula approximates the position of the arc midpoint
        const middle = position
            .clone()
            .add( average )
            .add( position )
            .add( position )
            .divideScalar( 4 );

        return { tube, entrance1, entrance2, threshold1, threshold2, middle };

    }

}

export function without( obj, ...keys ) {

    const stringKeys = keys.map( key => key.toString() );

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( stringKeys.indexOf( key ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

export function lerp( start, target, percent ) {

    return start + percent * ( target - start );

}

const loaders = {
    obj: new THREE.OBJLoader()
};

function getLoader( url:string ) {

    const extension:string = url.match( /\.(\w+)$/ )[ 1 ].toLowerCase();
    return loaders[ extension ];

}

export function loadModel( modelPath, data ) {

    return new Promise( ( resolve, reject ) => {

        const loader = getLoader( modelPath );
        loader.load(
            modelPath,
            ( model ) => resolve({ model, ...data }),
            () => null,
            ( error ) => reject({ error, ...data })
        );

    });

}

let counter = 0;

export function uid() {

    return Date.now() + '_' + ( counter++ );

}
