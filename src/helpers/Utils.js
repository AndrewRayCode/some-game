import THREE from 'three';
import Cardinality from '../helpers/Cardinality';

// Garbage library https://www.npmjs.com/package/three-loaders-collada
import ColladaLoader from 'three-collada-loader';

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
    js: new THREE.JSONLoader(),
    json: new THREE.ObjectLoader(),
    obj: new THREE.OBJLoader(),
    dae: new ColladaLoader(),
    font: new THREE.FontLoader(),
};
export { loaders };

function getLoader( url:string ) {

    const extension:string = url.match( /\.(\w+)$/ )[ 1 ].toLowerCase();
    return loaders[ extension ];

}

export function loadModel( modelPath, loader ) {

    return new Promise( ( resolve, reject ) => {

        const fileLoader = loader || getLoader( modelPath );
        fileLoader.load(
            modelPath,
            // success
            ( model, materials ) => resolve({ model, materials }),
            // loading
            () => null,
            // error
            error => reject({ error })
        );

    });

}

export function loadFont( fontPath ) {

    return new Promise( ( resolve, reject ) => {

        loaders.font.load(
            fontPath,
            font => resolve({ font }),
            () => null,
            error => reject({ error })
        );

    });

}

let counter = 0;

export function uid() {

    return Date.now() + '_' + ( counter++ );

}

export function assignUvs( geometry ) {

    geometry.computeBoundingBox();

    const max     = geometry.boundingBox.max;
    const min     = geometry.boundingBox.min;

    const offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
    const range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs = [[]];
    const faces = geometry.faces;

    for( let i = 0; i < geometry.faces.length; i++ ) {

        const v1 = geometry.vertices[faces[i].a];
        const v2 = geometry.vertices[faces[i].b];
        const v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
        ]);

    }

    geometry.uvsNeedUpdate = true;

}

export function getSphereMass( density, radius ) {

    return density * ( 4 / 3 ) * Math.PI * Math.pow( radius, 3 );

}

export function getCubeMass( density, side ) {

    return density * Math.pow( side, 3 );

}

const playerScreenSpaceMultiplier = 4.9;
export function getCameraDistanceToPlayer( playerY:number, fov:number, playerScale:number ) {

    const cameraAdjustedDistance = Math.abs(
        playerScale / Math.sin( ( fov * ( Math.PI / 180 ) ) / 2 )
    );

    // Solved graph for points (1,1) and (0,2)
    const scaleBasedOnSize = -playerScale + 2;

    return playerY + Math.max(
        scaleBasedOnSize * playerScreenSpaceMultiplier * cameraAdjustedDistance,
        1
    );

}

export function getCardinalityOfVector( v3 ) {

    // Not rotated
    if( v3.length() === 0 ) {
        return Cardinality.NULL;
    }

    const { field, value } = [
        { field: 'x', value: v3.x },
        { field: 'y', value: v3.y },
        { field: 'z', value: v3.z }
    ].sort( ( a, b ) => {
        return Math.abs( a.value ) - Math.abs( b.value );
    })[ 2 ];

    if( field === 'x' ) {
        return value < 0 ? Cardinality.LEFT : Cardinality.RIGHT;
    } else if( field === 'y' ) {
        return value < 0 ? Cardinality.BACK : Cardinality.FORWARD;
    } else {
        return value < 0 ? Cardinality.UP : Cardinality.DOWN;
    }

}

export function snapVectorAngleTo( v3, snapAngle ) {

    const angle = v3.angleTo( Cardinality.UP );

    if( angle < snapAngle / 2.0 ) {
        return Cardinality.UP.clone().multiplyScalar( v3.length() );
    } else if( angle > 180.0 - snapAngle / 2.0 ) {
        return Cardinality.DOWN.clone().multiplyScalar( v3.length() );
    }

    const t = Math.round( angle / snapAngle );
    const deltaAngle = ( t * snapAngle ) - angle;

    const axis = new THREE.Vector3().crossVectors( Cardinality.UP, v3 );
    const q = new THREE.Quaternion().setFromAxisAngle( axis, deltaAngle );

    return v3.clone().applyQuaternion( q );

}

export function resetBodyPhysics( body, position ) {

    // Position
    body.position = position;
    body.previousPosition = position;
    body.interpolatedPosition = position;


    // Velocity
    body.velocity = [ 0, 0 ];
    body.angularVelocity = 0;

    // Force
    body.force = [ 0, 0 ];

    // Sleep state reset
    body.sleepState = 0;
    body.timeLastSleepy = 0;
    body._wakeUpAfterNarrowphase = false;

}

export function lookAtVector( sourcePoint, destPoint ) {

    return new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt( sourcePoint, destPoint, Cardinality.UP )
    );

}

export function vec3Equals( a, b ) {
    return a.clone().sub( b ).length() < 0.0001;
}

export function findNextTube( tube, entrance, entities, scale ) {

    const { entrance1, entrance2 } = getEntrancesForTube( tube, scale );

    const isEntrance1 = vec3Equals( entrance, entrance1 );
    const isEntrance2 = vec3Equals( entrance, entrance2 );

    if( !isEntrance1 && !isEntrance2 ) {
        console.warn( 'Entrance',entrance,'did not match',entrance1,'or',entrance2 );
        return null;
    }

    const exit = isEntrance1 ? entrance2 : entrance1;

    const nextTube = entities.find( ( entity ) => {
        return vec3Equals( entity.position, exit );
    });

    if( nextTube ) {

        return getEntrancesForTube( nextTube, scale );

    }

}

export function snapTo( number, interval ) {

    return interval * Math.ceil( number / interval );

}

export function lerpVectors( vectorA:THREE.Vector3, vectorB:THREE.Vector3, percent:number, easingFn:any ) {

    return new THREE.Vector3().lerpVectors(
        vectorA, vectorB, easingFn ? easingFn( percent ) : percent
    );

}

export function lerpEulers( eulerA:THREE.Euler, eulerB:THREE.Euler, percent:number, easingFn:any ) {

    return new THREE.Euler().setFromVector3(
        lerpVectors( eulerA.toVector3(), eulerB.toVector3(), percent, easingFn )
    );

}

export function getFrustrumAt( distanceFromCamera:number, fov:number, aspect:number ) {

    const frustumHeight = 2.0 * distanceFromCamera * Math.tan( fov * 0.5 * ( Math.PI / 180 ) );

    const box = new THREE.Box2();
    const size = new THREE.Vector2( frustumHeight * aspect, frustumHeight );

    box.width = size.x;
    box.height = size.y;

    return box.setFromCenterAndSize(
        new THREE.Vector2( 0, 0 ),
        new THREE.Vector2(
            frustumHeight * aspect,
            frustumHeight
        )
    );

}

export function clampVector3( v3, min, max ) {

    const length = v3.length();
    return v3.clone().setLength( Math.max( Math.min( max, length ) ) );

}

export function p2AngleToEuler( angle ) {

    return new THREE.Euler( 0, -angle, 0 );

}

export function v3toP2( v3 ) {

    return [ v3.x, v3.z ];

}

export function p2ToV3( p2, y ) {

    return new THREE.Vector3( p2[ 0 ], y || 0, p2[ 1 ] );

}

export function str2Hex( str ) {

    return parseInt( str, 16 );

}

// Apply a series of reducers, continuation passing style, to the state object,
// and return the transformed state
export function applyMiddleware( actions, props, oldState, initialState, ...reducers ) {

    // Keep track of what reducer we're on, because when a reducer calls next()
    // it needs to call the next reducer in the array
    let index = -1;

    const next = ( newState ) => {

        index = index + 1;

        return reducers[ index ] ?
            // Either call the next reducer...
            reducers[ index ]( actions, props, oldState, newState, next ) :
            // Or we're at the end
            newState;

    };

    return next( initialState );

}

export function deepArrayClone( arr ) {

    if( Array.isArray( arr ) ) {
        const copy = arr.slice( 0 );
        for( let i = 0; i < copy.length; i++ ) {
            copy[ i ] = deepArrayClone( copy[ i ] );
        }
        return copy;
    } else if( typeof arr === 'object' ) {
        throw new Error( 'Cannot clone array containing an object!' );
    } else {
        return arr;
    }

}

export function wrapNumber( newNumber, upper, lower = 0 ) {

    if( newNumber < lower ) {
        return upper - 1;
    }

    return newNumber % ( upper - lower );

}

export function getTextWidth( text, fontName ) {

    // i'm lazy and will make this a passed arg later
    const font = window.fonts[ fontName ];

    return text.split( '' ).reduce( ( memo, letter ) => {
        return (
            ( font[ letter ].props.userData.ha * 0.001 ) || 20
        ) + memo;
    }, 0 );

}

export function bufferToGeometry( bufferGeometry:THREE.BufferGeometry ) {

    return new THREE.Geometry().fromBufferGeometry( bufferGeometry );

}

export function frac( f:number ) {

    return f % 1;

}
