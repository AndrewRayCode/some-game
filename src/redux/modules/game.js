import THREE from 'three';

const playerRadius = 0.45;
const playerDensity = 1000; // kg / m^3
const moveForce = 400;
const airMoveForce = 10;

const shrinkForceMultiplier = 1 / ( 8 * Math.sqrt( 2 ) );

// So the impulse you needs drops to 1/(8 * sqrt(2)) of the original.

const defaultState = {
    playerRadius, moveForce, airMoveForce, playerDensity,
    playerScale: 1,
    entities: {},
    levels: {}
};

export default function game( state = defaultState, action = {} ) {

    switch( action.type ) {

        case 'START_GAME':

            const { entities, levels } = action;

            return {
                ...state,
                levels: Object.keys( levels ).reduce( ( memo, id ) => {

                    const level = levels[ id ];
                    memo[ id ] = {
                        ...level,
                        entityIds: level.entityIds.filter(
                            ( eId ) => entities[ eId ].type !== 'player'
                        )
                    };
                    return memo;

                }, {} ),
                entities: Object.keys( entities ).reduce( ( memo, id ) => {

                    if( entities[ id ].type !== 'player' ) {

                        const entity = entities[ id ];
                        memo[ id ] = {
                            ...entity,
                            position: entity.position.clone(),
                            scale: entity.scale.clone(),
                            rotation: entity.rotation.clone(),
                        };

                    }

                    return memo;

                }, {} ),
                // Reverse to fix a bug where leftover player entities cause
                // old starting points to remain
                playerPosition: ( ( entities[ Object.keys( entities ).reverse().find(
                    id => entities[ id ].type === 'player'
                ) ] || {} ).position || new THREE.Vector3( 0, 1.5, 0 ) ).clone()
            };

        case 'SELECT_LEVEL':
            return {
                ...state,
                playerRadius: defaultState.playerRadius,
                playerScale: defaultState.playerScale
            };

        case 'SCALE_PLAYER':

            const level = state.levels[ action.levelId ];

            return {
                ...state,
                playerRadius: state.playerRadius * action.multiplier,
                playerScale: state.playerScale * action.multiplier,
                levels: {
                    ...state.levels,
                    [ level.id ]: {
                        ...level,
                        entityIds: level.entityIds.filter( id => id !== action.powerupIdToRemove )
                    }
                }
            };

        case 'END_GAME':
            return defaultState;

        default:
            return state;

    }

}

export function startGame( levelId, levels, entities ) {
    return {
        type: 'START_GAME',
        levelId, levels, entities
    };
}

export function advanceLevel( id ) {
    return {
        type: 'SELECT_LEVEL',
        id
    };
}

export function scalePlayer( levelId, powerupIdToRemove, multiplier ) {
    return {
        type: 'SCALE_PLAYER',
        levelId, powerupIdToRemove, multiplier
    };
}

export function endGame() {
    return { type: 'END_GAME' };
}
