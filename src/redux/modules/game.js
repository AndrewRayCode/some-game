import { Vector3, } from 'three';

const playerRadius = 0.45;
const playerDensity = 1000; // kg / m^3
const pushyDensity = 750; // kg / m^3

// So the impulse you needs drops to 1/(8 * sqrt(2)) of the original.

//const QUEUE_TEXT = 'game/QUEUE_TEXT';
const GAME_SELECT_CHAPTER = 'game/GAME_SELECT_CHAPTER';
const START_GAME = 'game/START_GAME';
const UPDATE_RUNNING_GAME_STATE = 'game/UPDATE_RUNNING_GAME_STATE';
const RESTART_CHAPTER = 'game/RESTART_CHAPTER';
const STOP_GAME = 'game/STOP_GAME';
const SCALE_PLAYER = 'game/SCALE_PLAYER';

// Find the player entity for this chapter to use the starting point, or
// default to the middle
function findPlayerPosition( levels, chapters, entities, chapterId ) {

    return ( ( levels[ chapters[ chapterId ].levelId ].entityIds
        .map( id => entities[ id ] )
        .find( entity => entity.type === 'player' ) || {}
    ).position || new Vector3( 0, 1.5, 0 ) ).clone();

}

function convertOriginalLevelsToGameLevels( levels, entities ) {

    // Remove player entities from each level
    return Object.keys( levels ).reduce( ( memo, id ) => {

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

    }, {} );

}

function convertOriginalEntitiesToGameEntities( originalEntities ) {

    return Object.keys( originalEntities ).reduce( ( memo, id ) => {

        const entity = originalEntities[ id ];
        if( entity.type !== 'player' ) {

            memo[ id ] = {
                ...entity,
                position: entity.position.clone(),
                scale: entity.scale.clone(),
                rotation: entity.rotation.clone(),
            };

        }

        return memo;

    }, {} );

}

const initialGameReducerState = {
    playerRadius, playerDensity, pushyDensity,
    playerScale: 1,
    entities: {},
    levels: {}
};

// Because we're mutating this at runtime, for now, on a new game, recreate it
const initialGameState = () => ({
    cameraPosition: new Vector3( 0, 0, 0 ),
});

export function game( state = initialGameReducerState, action = {} ) {

    const {
        originalEntities, originalLevels, chapters, books,
        recursionBusterId, restartBusterId, chapterId
    } = action;

    switch( action.type ) {

        case START_GAME:

            return {
                ...state,
                chapters, books,
                playerMaterialId: 'glowTextureFace',

                recursionBusterId: recursionBusterId || state.recursionBusterId,

                levels: convertOriginalLevelsToGameLevels( originalLevels, originalEntities ),
                entities: convertOriginalEntitiesToGameEntities( originalEntities ),

                playerPosition: findPlayerPosition( originalLevels, chapters, originalEntities, chapterId ),

                gameState: initialGameState()

            };

        case UPDATE_RUNNING_GAME_STATE:

            return {
                ...state,
                gameStaet: initialGameState,
            };

        case RESTART_CHAPTER:

            return {
                ...state,
                chapters, books,

                restartBusterId: restartBusterId || state.restartBusterId,

                levels: convertOriginalLevelsToGameLevels( originalLevels, originalEntities ),
                entities: convertOriginalEntitiesToGameEntities( originalEntities ),

                playerPosition: findPlayerPosition( originalLevels, chapters, originalEntities, chapterId ),
                playerRadius: initialGameReducerState.playerRadius,
                playerScale: initialGameReducerState.playerScale,
            };

        case GAME_SELECT_CHAPTER:

            return {
                ...state,
                recursionBusterId: action.recursionBusterId,
                playerRadius: state.playerRadius * ( action.nextChapter.scale.x < 1 ? 8 : 0.125 ),
                playerScale: state.playerScale * ( action.nextChapter.scale.x < 1 ? 8 : 0.125 ),
            };

        case SCALE_PLAYER:

            const level = state.levels[ action.levelId ];

            return {
                ...state,
                playerMaterialId: 'glowTextureFace',
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

        case STOP_GAME:
            return initialGameReducerState;

        default:
            return state;

    }

}

const defaultChapterState = {};
export function gameChapterReducer( state = defaultChapterState, action = {} ) {

    switch( action.type ) {

        case START_GAME:
            return {
                currentChapterId: action.chapterId,
            };

        case GAME_SELECT_CHAPTER:
            return {
                ...state,
                currentChapterId: action.chapterId,
                previousChapterId: state.currentChapterId,
                previousChapterNextChapter: action.nextChapter,
            };

        case STOP_GAME:
            return defaultChapterState;

        default:
            return state;

    }

}

const defaultBookState = null;
export function gameBookReducer( state = defaultBookState, action = {} ) {

    switch( action.type ) {

        case START_GAME:
            return action.bookId;

        case STOP_GAME:
            return defaultBookState;

        default:
            return state;

    }

}

export function updateGameState( newGameState:Object ) {
    return {
        type: UPDATE_RUNNING_GAME_STATE,
        newGameState,
    };
}

export function startGame( bookId, chapterId, originalLevels, originalEntities, books, chapters ) {

    return {
        type: START_GAME,
        bookId, chapterId, originalLevels, originalEntities, chapters, books
    };
}

export function restartChapter( chapterId, originalEntities, originalLevels, chapters, books ) {

    return {
        type: RESTART_CHAPTER,
        restartBusterId: Date.now(),
        chapterId, originalLevels, originalEntities, chapters, books
    };
}

export function advanceChapter( nextChapter ) {
    return {
        type: GAME_SELECT_CHAPTER,
        // If a chapter recurses into itself, for now, the chapterId will stay
        // the same, so the game won't know to update. If we change levels set
        // some unique timestamp to force the change. Another solution could be
        // to generate two chapters that reference each other, so the chapter
        // id would change even though they both contain the same level
        recursionBusterId: Date.now(),
        chapterId: nextChapter.chapterId,
        nextChapter
    };
}

export function scalePlayer(
    levelId:string,
    powerupIdToRemove:any,
    multiplier:any
) {
    return {
        type: SCALE_PLAYER,
        levelId, powerupIdToRemove, multiplier
    };
}

export function stopGame() {
    return { type: STOP_GAME, };
}
