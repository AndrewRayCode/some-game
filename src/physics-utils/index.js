import p2 from 'p2';
import THREE, { Vector3 } from 'three';

import {
    without, getSphereMass, getCubeMass, getCardinalityOfVector, v3toP2,
    p2ToV3, deepArrayClone,
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

export function onWorldBeginContact( gameState:Object, event:Object ) {

    let otherBody;
    const { bodyA, bodyB, contactEquations } = event;
    const { playerBody, playerContact } = gameState;

    // Figure out if either body equals the player, and if so, assign
    // otherBody to the other body
    if( bodyA === playerBody ) {

        otherBody = bodyB;

    } else if( bodyB === playerBody ) {

        otherBody = bodyA;

    }

    if( otherBody ) {

        // Get the contact point local to body a. There might be an easier
        // way to do this but I can't figure out how
        const { contactPointA } = contactEquations[ 0 ];

        // Convert it to world coordinates
        const contactPointWorld = [
            contactPointA[ 0 ] + bodyA.position[ 0 ],
            contactPointA[ 1 ] + bodyA.position[ 1 ]
        ];

        // Calculate the normal to the player position
        const contactToPlayerNormal = p2.vec2.normalize( [ 0, 0 ], [
            contactPointWorld[ 0 ] - playerBody.position[ 0 ],
            contactPointWorld[ 1 ] - playerBody.position[ 1 ]
        ]);

        const contactNormal = getCardinalityOfVector( new Vector3(
            contactToPlayerNormal[ 0 ],
            0,
            contactToPlayerNormal[ 1 ],
        ));

        const assign = {
            [ otherBody.id ]: contactNormal
        };

        //console.log('onPlayerColide with',otherBody.id, contactNormal);
        gameState.playerContact = { ...playerContact, ...assign };
        
    }

}

export function onWorldEndContact( gameState:Object, event:Object ) {

    let otherBody;
    const { bodyA, bodyB } = event;

    const { playerContact, playerBody, } = gameState;

    if( bodyA === playerBody ) {

        otherBody = bodyB;

    } else if( bodyB === playerBody ) {

        otherBody = bodyA;

    }

    if( otherBody ) {

        //console.log('ended contact with ',otherBody.id);
        gameState.playerContact = without( playerContact, otherBody.id );

    }

}

export function setUpWorld( gameState:Object ) {

    const world = new p2.World({
        gravity: [ 0, 9.82 ]
    });

    world.addContactMaterial( playerToPushyContact );
    world.addContactMaterial( playerToWallContact );
    world.addContactMaterial( pushyToWallContact );

    gameState.onWorldBeginContact = onWorldBeginContact.bind( null, gameState );
    gameState.onWorldEndContact = onWorldEndContact.bind( null, gameState );

    world.on( 'beginContact', gameState.onWorldBeginContact );
    world.on( 'endContact', gameState.onWorldEndContact );

    gameState.world = world;
    gameState.playerMaterial = playerMaterial;
    gameState.pushyMaterial = pushyMaterial;
    gameState.wallMaterial = wallMaterial;

}

export function setUpPhysics( gameState:Object, gameData:Object, playerPositionOverride2D:any ) {

    const {
        playerRadius, playerDensity, pushyDensity,
        currentLevelStaticEntitiesArray, currentLevelMovableEntitiesArray,
        currentLevelBridgesArray
    } = gameData;

    const playerPosition = playerPositionOverride2D || v3toP2(
        gameData.playerPosition
    );

    const playerBody = createPlayerBody(
        playerMaterial,
        playerPosition,
        playerRadius,
        playerDensity
    );

    const { world } = gameState;

    world.addBody( playerBody );
    gameState.playerBody = playerBody;

    gameState.physicsBodies = currentLevelMovableEntitiesArray.map( entity => {
        const { position, scale } = entity;

        const pushyBody = new p2.Body({
            mass: getCubeMass( pushyDensity, scale.x * 0.8 ),
            position: v3toP2( position ),
            fixedRotation: true
        });

        // Copy scale to pushyBody so _getMeshStates can access it to pass
        // to three
        pushyBody.scale = scale;
        pushyBody.entityId = entity.id;

        // Store the y position as "depth" to place this object correctly
        // set back into the screen
        pushyBody.depth = position.y;

        const pushyShape = new p2.Box({
            material: gameState.pushyMaterial,
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
    gameState.emptyWorldAnchor = emptyWorldAnchor;
    
    // Construct the data needed for all bridges (planks and anchors)
    const bridgeData = currentLevelBridgesArray.reduce( ( memo, bridgeEntity ) => {

        const {
            scale, position, segments, paddingPercent, id
        } = bridgeEntity;

        // This is duplicated in the bridge component which isn't ideal,
        // but there are more comments there
        const { x: width, y: size } = scale;
        const plankWidth = size * ( width / segments );
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
                    position.z + ( 0.5 * size ),
                ],
            });

            const plankShape = new p2.Box({
                material: gameState.wallMaterial,
                width: plankBodyWidth,
                height: 0.1 * size
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
                        position.x - ( width * size * 0.5 ) - ( plankBodyWidth * anchorInsetPercent * 2 /* little more cause no padding */ ),
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
                        position.x + ( width * size * 0.5 ) + ( plankBodyWidth * anchorInsetPercent * 2 ),
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

    gameState.plankData = bridgeData.planks;
    gameState.plankConstraints = bridgeData.constraints;

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
                material: gameState.wallMaterial,
                width: scale.x,
                height: scale.z,
            });
            entityBody.addShape( shape );

        }

        entityBody.entity = entity;
        world.addBody( entityBody );

    });

    gameState.playerContact = {};

}

export function tearDownWorld( gameState:Object ) {

    const { world } = gameState;

    // We could manually removeBody() for all bodies, but that does a lot
    // of work that we don't care about, see
    // http://schteppe.github.io/p2.js/docs/files/src_world_World.js.html#l1005
    world.off( 'beginContact', gameState.onWorldBeginContact );
    world.off( 'endContact', gameState.onWorldEndContact );
    world.clear();

    gameState.world = null;

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
    gameState:Object,
    reduxScalePlayer:Function,
    playerRadius:number,
    playerPosition:Vector3,
    playerDensity:number,
    entityId:any,
    currentLevelId:string,
    isShrinking:any
) {

    const multiplier = isShrinking ? 0.5 : 2;
    const newRadius = multiplier * playerRadius;
    const radiusDiff = playerRadius - newRadius;

    gameState.world.removeBody( gameState.playerBody );

    const newPlayerBody = createPlayerBody(
        playerMaterial,
        [
            playerPosition.x,
            playerPosition.z + radiusDiff
        ],
        newRadius,
        playerDensity,
    );

    gameState.world.addBody( newPlayerBody );

    gameState.playerBody = newPlayerBody;

    // Reset contact points
    gameState.playerContact = {};

    // TODO: Fix this side effect
    reduxScalePlayer( currentLevelId, entityId, multiplier );

    return radiusDiff;

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

