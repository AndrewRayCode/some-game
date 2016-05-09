import THREE, {
    Quaternion, Vector3, Euler, Geometry, Vector2, Box2, Matrix4,
    BufferGeometry, JSONLoader, ObjectLoader, OBJLoader, FontLoader,
} from 'three';
import Cardinality from '../helpers/Cardinality';

// Garbage library https://www.npmjs.com/package/three-loaders-collada
import ColladaLoader from 'three-collada-loader';

// Garbage library https://github.com/sohamkamani/three-object-loader/issues/1
import mutateThreeWithObjLoader from 'three-obj-loader';
mutateThreeWithObjLoader( THREE );

// Given the player position and entiy position in 3d space, do a 2d collision
// check
export function playerToBoxCollision3dTo2d(
    positionA:Vector3,
    radiusA:number,
    positionB:Vector3,
    scaleB:Object,
):boolean {

    const halfX = scaleB.x * 0.5;
    const halfZ = scaleB.z * 0.5;

    const distX = Math.abs( positionA.x - positionB.x - halfX );
    const distZ = Math.abs( positionA.z - positionB.z - halfZ );

    if( ( distX > halfX + radiusA ) ||
        ( distX > halfZ + radiusA )
    ) {
        return false;
    }

    if( ( distX <= halfX ) ||
        ( distX <= halfZ )
    ) {
        return false;
    }

    const dx = distX - halfX;
    const dz = distZ - halfZ;

    return ( dx * dx ) + ( dz * dz ) <= radiusA * radiusA;

}

// Given vector3 world positions, calculate if intersection with circle
export function playerToCircleCollision3dTo2d(
    positionA:Vector3,
    radiusA:number,
    positionB:Vector3,
    radiusB:number,
):boolean {

    return new Vector2( positionA.x, positionA.z ).distanceTo(
        new Vector2( positionB.x, positionB.z )
    ) < ( radiusA + radiusB );

}

// Finish line hit detection. We scale down the radius as a cheap way to guess
// if we're hitting the finish line "flag" plane of the finish line
export function playerV3ToFinishEntityV3Collision(
    playerPosition:Vector3,
    radiusA:number,
    positionB:Vector3,
    scaleB:Object,
):boolean {

    return playerToBoxCollision3dTo2d(
        playerPosition, radiusA * 0.5, positionB, scaleB,
    );

}

export function getEntrancesForTube( tube:Object, scaleFactor:number ) {

    const { position, rotation, type } = tube;

    if( type === 'tube' ) {

        const rotatedQuaternion = rotation.clone().multiply(
            new Quaternion().setFromEuler( new Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new Vector3( 1, 0, 0 )
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
            new Quaternion().setFromEuler( new Euler(
                THREE.Math.degToRad( 0 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVector = new Vector3( 1, 0, 0 )
            .applyQuaternion( rotatedQuaternion )
            .multiplyScalar( scaleFactor );

        const bentQuaternion = rotation.clone().multiply(
            new Quaternion().setFromEuler( new Euler(
                THREE.Math.degToRad( -90 ),
                THREE.Math.degToRad( 90 ),
                0
            ))
        );

        const directionVectorBent = new Vector3( 1, 0, 0 )
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

export function without( obj:Object, ...keys ) {

    const stringKeys = keys.map( key => key.toString() );

    return Object.keys( obj ).reduce( ( memo, key ) => {
        if( stringKeys.indexOf( key ) === -1 ) {
            memo[ key ] = obj[ key ];
        }
        return memo;
    }, {} );

}

export function lerp( start:number, target:number, percent:number ) {

    return start + percent * ( target - start );

}

const loaders = {
    js: new JSONLoader(),
    json: new ObjectLoader(),
    obj: new OBJLoader(),
    dae: new ColladaLoader(),
    font: new FontLoader(),
};
export { loaders };

function getLoader( url:string ) {

    const extension:string = url.match( /\.(\w+)$/ )[ 1 ].toLowerCase();
    return loaders[ extension ];

}

export function loadModel( modelPath:string, loader:any ) {

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

export function loadFont( fontPath:string ) {

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

export function assignUvs( geometry:Object ) {

    geometry.computeBoundingBox();

    const max     = geometry.boundingBox.max;
    const min     = geometry.boundingBox.min;

    const offset  = new Vector2(0 - min.x, 0 - min.y);
    const range   = new Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs = [[]];
    const faces = geometry.faces;

    for( let i = 0; i < geometry.faces.length; i++ ) {

        const v1 = geometry.vertices[faces[i].a];
        const v2 = geometry.vertices[faces[i].b];
        const v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
            new Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
            new Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
        ]);

    }

    geometry.uvsNeedUpdate = true;

}

export function getSphereMass( density:number, radius:number ) {

    return density * ( 4 / 3 ) * Math.PI * Math.pow( radius, 3 );

}

export function getCubeMass( density:number, side:number ) {

    return density * Math.pow( side, 3 );

}

const playerScreenSpaceMultiplier = 4.1;
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

export function getCardinalityOfVector( v3:Vector3 ) {

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

export function snapVectorAngleTo( v3:Vector3, snapAngle:number ) {

    const angle = v3.angleTo( Cardinality.UP );

    if( angle < snapAngle / 2.0 ) {
        return Cardinality.UP.clone().multiplyScalar( v3.length() );
    } else if( angle > 180.0 - snapAngle / 2.0 ) {
        return Cardinality.DOWN.clone().multiplyScalar( v3.length() );
    }

    const t = Math.round( angle / snapAngle );
    const deltaAngle = ( t * snapAngle ) - angle;

    const axis = new Vector3().crossVectors( Cardinality.UP, v3 );
    const q = new Quaternion().setFromAxisAngle( axis, deltaAngle );

    return v3.clone().applyQuaternion( q );

}

export function lookAtVector( sourcePoint:Vector3, destPoint:Vector3 ) {

    return new Quaternion().setFromRotationMatrix(
        new Matrix4().lookAt( sourcePoint, destPoint, Cardinality.UP )
    );

}

export function vec3Equals( a:Vector3, b:Vector3 ) {
    return a.clone().sub( b ).length() < 0.0001;
}

export function findNextTube( tube:Object, entrance:Vector3, entities:Array, scale:number ) {

    const { entrance1, entrance2 } = getEntrancesForTube( tube, scale );

    const isEntrance1 = vec3Equals( entrance, entrance1 );
    const isEntrance2 = vec3Equals( entrance, entrance2 );

    if( !isEntrance1 && !isEntrance2 ) {
        console.warn( 'Entrance',entrance,'did not match',entrance1,'or',entrance2 );
        return null;
    }

    const exit = isEntrance1 ? entrance2 : entrance1;

    const nextTube = entities.find( entity => {
        return vec3Equals( entity.position, exit );
    });

    if( nextTube ) {

        return getEntrancesForTube( nextTube, scale );

    }

}

export function snapTo( number:number, interval:number ) {

    return interval * Math.ceil( number / interval );

}

export function lerpVectors( vectorA:Vector3, vectorB:Vector3, percent:number, easingFn:any ) {

    return new Vector3().lerpVectors(
        vectorA, vectorB, easingFn ? easingFn( percent ) : percent
    );

}

export function lerpEulers( eulerA:Euler, eulerB:Euler, percent:number, easingFn:any ) {

    return new Euler().setFromVector3(
        lerpVectors( eulerA.toVector3(), eulerB.toVector3(), percent, easingFn )
    );

}

export function getFrustrumAt( distanceFromCamera:number, fov:number, aspect:number ) {

    const frustumHeight = 2.0 * distanceFromCamera * Math.tan( fov * 0.5 * ( Math.PI / 180 ) );

    const box = new Box2();
    const size = new Vector2( frustumHeight * aspect, frustumHeight );

    box.width = size.x;
    box.height = size.y;

    return box.setFromCenterAndSize(
        new Vector2( 0, 0 ),
        new Vector2(
            frustumHeight * aspect,
            frustumHeight
        )
    );

}

export function clampVector3( v3:Vector3, min:number, max:number ) {

    const length = v3.length();
    return v3.clone().setLength( Math.max( Math.min( max, length ) ) );

}

export function p2AngleToEuler( angle:number ) {

    return new Euler( 0, -angle, 0 );

}

export function v3toP2( v3:Vector3 ) {

    return [ v3.x, v3.z ];

}

export function p2ToV3( p2:Array|Float32Array, y:any ) {

    return new Vector3( p2[ 0 ], y || 0, p2[ 1 ] );

}

export function str2Hex( str:string ) {

    return parseInt( str, 16 );

}

// Apply a series of reducers, continuation passing style, to the state object,
// and return the transformed state
export function applyMiddleware(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    initialState:Object,
    ...reducers
) {

    // Keep track of what reducer we're on, because when a reducer calls next()
    // it needs to call the next reducer in the array
    let index = -1;

    const next = newState => {

        index = index + 1;

        if( !reducers[ index ] && index < reducers.length ) {
            console.error( 'One of your reducers is undefined: ', reducers );
            throw new Error( 'One of your reducers is undefined.' );
        }

        return reducers[ index ] ?
            // Either call the next reducer...
            reducers[ index ]( keysDown, actions, gameData, oldState, newState, next ) :
            // Or we're at the end
            newState;

    };

    return {
        ...oldState,
        ...next( initialState ),
    };

}

export function deepArrayClone( arr:any ) {

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

export function wrapNumber( newNumber:number, upper:number, lower = 0 ) {

    if( newNumber < lower ) {
        return upper - 1;
    }

    return newNumber % ( upper - lower );

}

export function getTextWidth( text:string, fontName:string ) {

    // i'm lazy and will make this a passed arg later
    const font = window.fonts[ fontName ];

    return text.split( '' ).reduce( ( memo, letter ) => {
        return (
            ( font[ letter ].props.userData.ha * 0.001 ) || 20
        ) + memo;
    }, 0 );

}

export function bufferToGeometry( bufferGeometry:BufferGeometry ) {

    return new Geometry().fromBufferGeometry( bufferGeometry );

}

export function frac( f:number ) {

    return f % 1;

}

export function toScreenPosition( width:number, height:number, matrix:Object, camera:Object ) {

    const vector = new Vector3();

    const widthHalf = 0.5 * width;
    const heightHalf = 0.5 * height;

    vector.setFromMatrixPosition( matrix );
    vector.project( camera );

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return new Vector2( vector.x, vector.y );

}

// Return how far the player is set from the back of the screen. This may look
// simple, but seeing "1 + playerRadius" across the codebase is confusing
export function getPlayerYFromRadius( radius:number ) {
    return radius + 1;
}
