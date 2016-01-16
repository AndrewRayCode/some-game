import THREE from 'three';

const defaultState = {
    playerRadius: 0.45,
    playerScale: 1,
    playerMass: 5,
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
                playerPosition: ( ( entities[ Object.keys( entities ).find(
                    ( id ) => entities[ id ].type === 'player'
                ) ] || {} ).position || new THREE.Vector3( 0, 1.5, 0 ) ).clone()
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

export function scalePlayer( levelId, powerupIdToRemove, multiplier ) {
    return {
        type: 'SCALE_PLAYER',
        levelId, powerupIdToRemove, multiplier
    };
}

export function endGame() {
    return { type: 'END_GAME' };
}
