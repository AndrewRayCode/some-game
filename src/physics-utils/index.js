import p2 from 'p2';
import THREE, { Vector3 } from 'three';

import {
    getSphereMass, getCubeMass, v3toP2, p2ToV3, deepArrayClone,
} from 'helpers/Utils';

const radialPoint = ( total, index ) => [
    Math.cos( THREE.Math.degToRad( ( 90 / total ) * index ) ) - 0.5,
    -( Math.sin( THREE.Math.degToRad( ( 90 / total ) * index ) ) - 0.5 )
];

// Generate points along a curve between 0 and 90 degrees along a circle
const radialPoints = total =>
    new Array( total ).fill( 0 ).map( ( zero, index ) =>
        radialPoint( total + 2, index + 1 )
    );

// Counter clockwise. Note that my y axis is swapped relative to p2 :(
const curvedWallVertices = [
    [ -0.5, 0.5 ], // bottom left
    [ 0.5, 0.5 ], // bottom right
    ...radialPoints( 3 ), // Curve
    [ -0.5, -0.5 ] // top left
];


const playerMaterial = new p2.Material();
const pushyMaterial = new p2.Material();
const wallMaterial = new p2.Material();

const yAxis = p2.vec2.fromValues( 0, -1 );

// Player to wall
const playerToWallContact = new p2.ContactMaterial( playerMaterial, wallMaterial, {
    friction: 0.0,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0.1,
});

// Player to pushy
const playerToPushyContact = new p2.ContactMaterial( playerMaterial, pushyMaterial, {
    friction: 0,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0,
});

// Pushy to wall
const pushyToWallContact = new p2.ContactMaterial( pushyMaterial, wallMaterial, {
    friction: 0.5,
    // Bounciness (0-1, higher is bouncier). How much energy is conserved
    // after a collision
    restitution: 0,
});

export function createPlayerBody( material:Object, position:Array, radius:number, density:number ) {

    const playerBody = new p2.Body({
        mass: getSphereMass( density, radius ),
        fixedRotation: true,
        position
    });

    const playerShape = new p2.Circle({ material, radius, });

    playerBody.addShape( playerShape );

    return playerBody;

}

// Probably better to decopule these further by passing them in from outside
export function onWorldBeginContact( actions:Object, event:Object ) {

    // p2 events are sync, and they happen in the middle of a reducer sequence.
    // if we dispatch immediately, the state gets updated, but then the reducer
    // sequence finishes and the final reduced state overwrites the state that
    // we added this event to. if we do async then the next frame reducer loop
    // will handle it. Maybe worth revisiting
    setTimeout( () => actions.queueBeginContactEvent( event ), 0 );

}

export function onWorldEndContact( actions:Object, event:Object ) {

    setTimeout( () => actions.queueEndContactEvent( event ), 0 );

}

export function createWorld( actions:Object ) {

    const world = new p2.World({
        gravity: [ 0, 9.82 ]
    });

    world.addContactMaterial( playerToPushyContact );
    world.addContactMaterial( playerToWallContact );
    world.addContactMaterial( pushyToWallContact );

    world.onWorldBeginContact = onWorldBeginContact.bind( null, actions );
    world.onWorldEndContact = onWorldEndContact.bind( null, actions );

    world.on( 'beginContact', world.onWorldBeginContact );
    world.on( 'endContact', world.onWorldEndContact );

    world.playerMaterial = playerMaterial;
    world.pushyMaterial = pushyMaterial;
    world.wallMaterial = wallMaterial;

    return world;

}

export function setUpPhysics(
    world:Object,
    playerPosition:Array,
    playerRadius:number,
    playerDensity:number,
    pushyDensity:number,
    currentLevelStaticEntitiesArray:Array,
    currentLevelMovableEntitiesArray:Array,
    currentLevelBridgesArray:Array,
) {

    const playerBody = createPlayerBody(
        playerMaterial,
        playerPosition,
        playerRadius,
        playerDensity
    );

    world.addBody( playerBody );

    const physicsBodiesByEntityId = {};

    const physicsBodies = currentLevelMovableEntitiesArray.map( entity => {

        const { position, scale } = entity;

        const pushyBody = new p2.Body({
            mass: getCubeMass( pushyDensity, scale.x * 0.8 ),
            position: v3toP2( position ),
            fixedRotation: true,
        });

        // Copy scale to pushyBody so _getMeshStates can access it to pass
        // to three
        pushyBody.scale = scale;
        pushyBody.entityId = entity.id;

        physicsBodiesByEntityId[ entity.id ] = pushyBody;

        // Store the y position as "depth" to place this object correctly
        // set back into the screen
        pushyBody.depth = position.y;

        const pushyShape = new p2.Box({
            material: world.pushyMaterial,
            width: scale.x,
            height: scale.z,
        });

        pushyBody.addShape( pushyShape );
        world.addBody( pushyBody );
        return pushyBody;

    });

    const emptyWorldAnchor = new p2.Body({
        mass: 0,
        position: [ -100, -100 ]
    });
    world.addBody( emptyWorldAnchor );
    
    // Construct the data needed for all bridges (planks and anchors)
    const bridgeData = currentLevelBridgesArray.reduce( ( memo, bridgeEntity ) => {

        const {
            scale, position, segments, paddingPercent, id
        } = bridgeEntity;

        // This is duplicated in the bridge component which isn't ideal,
        // but there are more comments there
        const { x: width, y: size } = scale;

        // x is correct world width
        //const width = unscaledWidth / size;

        // needs to be real world
        const plankWidth = ( width / segments );
        const plankStartX = -( width / 2 ) + ( plankWidth / 2 );
        const plankBodyWidth = plankWidth - ( paddingPercent * plankWidth );

        // Generate an array to map over for how many planks there are
        const segmentsArray = new Array( segments ).fill( 0 );

        // Build the planks only
        const planks = segmentsArray.map( ( zero, index ) => {

            const plankBody = new p2.Body({
                mass: getCubeMass( pushyDensity, plankWidth * 1 ),
                position: [
                    position.x + ( plankWidth * index + plankStartX ),
                    position.z - ( 0.5 * size ), // z up is negative!
                ],
            });

            const plankShape = new p2.Box({
                material: world.wallMaterial,
                width: plankBodyWidth,
                height: 0.2 * size
            });

            plankBody.entityId = id;
            plankBody.depth = position.y;

            plankBody.addShape( plankShape );

            world.addBody( plankBody );
            memo.planks.push( plankBody );

            return plankBody;

        });

        // Bridge plank constants. Hard coded for now, mabye put into the
        // editor later, the problem is that things like distance are
        // computed values. Actually could probably multiply computed
        // value by some "relax" editor value
        const anchorInsetPercent = 0.1;

        // Calculate how long the ropes at rest should be between each
        // plank
        const distance = ( plankWidth * paddingPercent ) +
            ( plankBodyWidth * anchorInsetPercent * 2 );

        const maxForce = 1000000;

        // Build the anchors!
        segmentsArray.map( ( zero, index ) => {

            const plankBody = planks[ index ];
            const nextPlank = planks[ index + 1 ];

            // Is this the first plank? anchor to the left
            if( index === 0 ) {

                // Figure out the world position of the left anchor...
                const emptyAnchorBefore = new p2.Body({
                    mass: 0,
                    position: [
                        // little more cause no padding
                        position.x - ( width * 0.5 ) - ( plankBodyWidth * anchorInsetPercent * 2 ),
                        // (z up is negative) Use 0.4 to avoid top of rope clipping through walls
                        position.z - ( 0.4 * size ),
                    ],
                });

                // Build a constraint with the proper anchor positions
                const beforeConstraint = new p2.DistanceConstraint( emptyAnchorBefore, plankBody, {
                    maxForce, distance,
                    localAnchorA: [ 0, 0 ],
                    localAnchorB: [
                        -( plankBodyWidth / 2 ) + ( plankBodyWidth * anchorInsetPercent ),
                        0,
                    ],
                });

                // Data needed to group these anchors later at runtime
                beforeConstraint.entityId = id;
                beforeConstraint.depth = position.y;
                memo.constraints.push( beforeConstraint );

                world.addBody( emptyAnchorBefore );
                world.addConstraint( beforeConstraint );

            }

            // If there's a next plank, anchor to it
            if( nextPlank ) {

                const betweenConstraint = new p2.DistanceConstraint( plankBody, nextPlank, {
                    maxForce, distance,
                    localAnchorA: [
                        ( plankBodyWidth / 2 ) - ( plankBodyWidth * anchorInsetPercent ),
                        0,
                    ],
                    localAnchorB: [
                        -( plankBodyWidth / 2 ) + ( plankBodyWidth * anchorInsetPercent ),
                        0,
                    ],
                });

                betweenConstraint.entityId = id;
                betweenConstraint.depth = position.y;
                memo.constraints.push( betweenConstraint );

                world.addConstraint( betweenConstraint );

            // Otherwise build the last world anchor
            } else {

                const emptyAnchorAfter = new p2.Body({
                    mass: 0,
                    position: [
                        position.x + ( width * 0.5 ) + ( plankBodyWidth * anchorInsetPercent * 2 ),
                        position.z - ( 0.4 * size ),
                    ],
                });

                const afterConstraint = new p2.DistanceConstraint( plankBody, emptyAnchorAfter, {
                    maxForce, distance,
                    localAnchorA: [
                        ( plankWidth / 2 ) - ( plankBodyWidth * anchorInsetPercent ),
                        0,
                    ],
                    localAnchorB: [ 0, 0 ],
                });

                afterConstraint.entityId = id;
                afterConstraint.depth = position.y;
                memo.constraints.push( afterConstraint );

                world.addBody( emptyAnchorAfter );
                world.addConstraint( afterConstraint );

            }

        });

        return memo;

    }, { planks: [], constraints: [] } );

    currentLevelStaticEntitiesArray.forEach( entity => {

        const { position, scale, rotation, type } = entity;

        const entityBody = new p2.Body({
            mass: 0,
            position: v3toP2( position ),
        });
        
        let shape;
        if( type === 'curvedwall' ) {

            // Current version of p2 doesn't copy the vertices in and
            // breaks when level restarts, lame. We have to map back to
            // threejs to properly rotate and scale the verts
            const vertices = deepArrayClone( curvedWallVertices )
                .map( xy =>
                    v3toP2( p2ToV3( xy )
                        .applyQuaternion( rotation )
                        .multiply( scale ) )
                );
            entityBody.fromPolygon( vertices );

        } else {

            shape = new p2.Box({
                material: world.wallMaterial,
                width: scale.x,
                height: scale.z,
            });
            entityBody.addShape( shape );

        }

        physicsBodiesByEntityId[ entity.id ] = entityBody;

        entityBody.entity = entity;
        world.addBody( entityBody );

    });

    return {
        playerContact: {},
        // the GameRenderer will read these later for visual conversion
        plankData: bridgeData.planks,
        plankConstraints: bridgeData.constraints,
        emptyWorldAnchor,
        playerBody,
        physicsBodies,
        physicsBodiesByEntityId,
    };

}

export function tearDownWorld( world:Object ) {

    // We could manually removeBody() for all bodies, but that does a lot
    // of work that we don't care about, see
    // http://schteppe.github.io/p2.js/docs/files/src_world_World.js.html#l1005
    world.off( 'beginContact', world.onWorldBeginContact );
    world.off( 'endContact', world.onWorldEndContact );
    world.clear();

}

export function emptyWorld( world:Object ) {

    world.clear();

    // Re-add stuff. World.clear() resets contacts and gravity
    world.addContactMaterial( playerToPushyContact );
    world.addContactMaterial( playerToWallContact );
    world.addContactMaterial( pushyToWallContact );

    world.gravity = [ 0, 9.82 ];

}

export function canJump( world:Object, body:Object ):bool {

    return world.narrowphase.contactEquations.some( contact => {

        if( contact.bodyA === body || contact.bodyB === body ) {

            let d = p2.vec2.dot( contact.normalA, yAxis );
            if( contact.bodyA === body ) {
                d *= -1;
            }
            return d > 0.5;

        }

    });

}

export function scalePlayer(
    world:Object,
    playerBody:Object,
    playerRadius:number,
    playerPosition:Vector3,
    playerDensity:number,
    isShrinking:any
) {

    const multiplier = isShrinking ? 0.5 : 2;
    const newRadius = multiplier * playerRadius;
    const radiusDiff = playerRadius - newRadius;

    world.removeBody( playerBody );

    const newPlayerBody = createPlayerBody(
        playerMaterial,
        [
            playerPosition.x,
            playerPosition.z + radiusDiff
        ],
        newRadius,
        playerDensity,
    );

    world.addBody( newPlayerBody );

    return {
        radiusDiff,
        multiplier,
        playerBody: newPlayerBody,
    };

}

export function resetBodyPhysics( body:Object, position:Array ) {

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
