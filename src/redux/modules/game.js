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

const GAME_SELECT_CHAPTER = 'game/GAME_SELECT_CHAPTER';
const START_GAME = 'game/START_GAME';
const END_GAME = 'game/END_GAME';
const SCALE_PLAYER = 'game/SCALE_PLAYER';

export function game( state = defaultState, action = {} ) {

    switch( action.type ) {

        case START_GAME:

            const { entities, levels, chapters, books } = action;

            return {
                ...state,
                chapters, books,

                // Remove player entities from each level
                levels: Object.keys( levels ).reduce( ( memo, id ) => {

                    const level = levels[ id ];
                    return {
                        ...memo,
                        [ id ]: {
                            ...level,
                            entityIds: level.entityIds.filter(
                                eId => entities[ eId ].type !== 'player'
                            )
                        }
                    };

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

                // Find the player entity for this chapter to use the starting
                // point, or default to the middle
                playerPosition: ( ( levels[ chapters[ action.chapterId ].levelId ].entityIds
                    .map( id => entities[ id ] )
                    .find( entity => entity.type === 'player' ) || {}
                ).position || new THREE.Vector3( 0, 1.5, 0 ) ).clone()
            };

        case GAME_SELECT_CHAPTER:
            return {
                ...state,
                recursionBusterId: action.recursionBusterId,
                playerRadius: state.playerRadius * ( action.levelScale < 1 ? 8 : 0.125 ),
                playerScale: state.playerScale * ( action.levelScale < 1 ? 8 : 0.125 ),
            };

        case SCALE_PLAYER:

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

        case END_GAME:
            return defaultState;

        default:
            return state;

    }

}

export function gameChapterReducer( state = null, action = {} ) {

    switch( action.type ) {

        case START_GAME:
        case GAME_SELECT_CHAPTER:
            return action.chapterId;

        default:
            return state;

    }

}

export function gameBookReducer( state = null, action = {} ) {

    switch( action.type ) {

        case START_GAME:
        case GAME_SELECT_CHAPTER:
            return action.bookId;

        default:
            return state;

    }

}

export function startGame( bookId, chapterId, levels, entities, books, chapters ) {
    return {
        type: START_GAME,
        bookId, chapterId, levels, entities, chapters, books
    };
}

export function advanceChapter( chapterId, chapterScale ) {
    return {
        type: GAME_SELECT_CHAPTER,
        // If a chapter recurses into itself, for now, the chapterId will stay
        // the same, so the game won't know to update. If we change levels set
        // some unique timestamp to force the change. Another solution could be
        // to generate two chapters that reference each other, so the chapter
        // id would change even though they both contain the same level
        recursionBusterId: Date.now(),
        chapterId, chapterScale
    };
}

export function scalePlayer( levelId, powerupIdToRemove, multiplier ) {
    return {
        type: SCALE_PLAYER,
        levelId, powerupIdToRemove, multiplier
    };
}

export function endGame() {
    return { type: END_GAME };
}
