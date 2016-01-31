import THREE from 'three';

const playerScale = 1;
const playerRadius = 0.45;
const playerDensity = 1000; // kg / m^3
const pushyDensity = 750; // kg / m^3

const shrinkForceMultiplier = 1 / ( 8 * Math.sqrt( 2 ) );

// So the impulse you needs drops to 1/(8 * sqrt(2)) of the original.

const defaultState = {
    playerRadius, playerDensity, pushyDensity,
    playerScale: 1,
    entities: {},
    levels: {}
};

export function game( state = defaultState, action = {} ) {

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
                playerPosition: ( ( levels[ action.levelId ].entityIds
                    .map( id => entities[ id ] )
                    .find( entity => entity.type === 'player' ) || {}
                ).position || new THREE.Vector3( 0, 1.5, 0 ) ).clone()
            };

        case 'GAME_SELECT_LEVEL':
            return {
                ...state,
                playerRadius: action.levelScale < 1 ? playerRadius : playerRadius * 0.125,
                playerScale: action.levelScale < 1 ? playerScale : playerScale * 0.125
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

export function gameLevelReducer( state = null, action = {} ) {

    switch( action.type ) {

        case 'START_GAME':
        case 'GAME_SELECT_LEVEL':
            return action.levelId;

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

export function advanceLevel( levelId, levelScale ) {
    return {
        type: 'GAME_SELECT_LEVEL',
        levelId, levelScale
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
