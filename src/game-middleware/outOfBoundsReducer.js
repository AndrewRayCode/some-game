import { scalePlayer, } from 'physics-utils';
import { SHIFT, MINUS, EQUALS, BACKTICK, } from 'helpers/KeyCodes';

const bounds = {
    x: {
        upper: 6,
        lower: -6,
    },
    y: {
        upper: 6,
        lower: -6,
    },
};

export default function outOfBoundsReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { playerBody, } = currentState;
    const { position, } = playerBody;
    const x = position[ 0 ];
    const y = position[ 1 ];

    if( ( x < bounds.x.lower ) ||
        ( x > bounds.x.upper ) ||
        ( y < bounds.y.lower ) ||
        ( y > bounds.y.upper )
    ) {

        const {
            currentChapterId, originalEntities, originalLevels, chapters,
            books, gameState, currentBookId,
        } = gameData;

        const { world, } = gameState;


        return {
            ...currentState,
            sideEffectQueue: [
                ...oldState.sideEffectQueue,
                () => actions.restartChapter(
                    actions, currentBookId, currentChapterId, originalEntities, originalLevels,
                    chapters, books, world
                )
            ],
        };

    }

    return next( currentState );

}
