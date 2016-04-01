import { lerpVectors } from '../helpers/Utils';
import { easeOutQuint, } from '../helpers/easing';

const levelTransitionDuration = 500;

export default function advanceLevelReducer( actions, props, oldState, currentState, next ) {

    const {
        currentTransitionStartTime, startTransitionPosition,
        currentTransitionTarget, advanceToNextChapter,
        transitionCameraPositionStart, currentTransitionCameraTarget,
        isAdvancing,
        transitionPercent: lastTransitionPercent,
    } = oldState;

    const { advanceChapter } = actions;

    const { time, } = currentState;

    if( isAdvancing ) {

        // This starts a chain of events that ends in
        // transitionFromLastChapterToNextChapter() called by the game. This
        // will only happen on the frame *after* the percent hits 1, because
        // we need to ensure the state is set before changing levels. I don't
        // remember why
        if( lastTransitionPercent === 1 ) {

            advanceChapter( advanceToNextChapter );
            return currentState;

        }

        const newState = {};
        const transitionPercent = Math.min(
            ( ( time - currentTransitionStartTime ) * 1000 ) / levelTransitionDuration,
            1
        );

        newState.transitionPercent = transitionPercent;
        newState.currentTransitionPosition = startTransitionPosition
            .clone()
            .lerp( currentTransitionTarget, transitionPercent );

        newState.cameraPosition = lerpVectors(
            transitionCameraPositionStart,
            currentTransitionCameraTarget,
            transitionPercent,
            easeOutQuint
        );

        return {
            ...currentState,
            ...newState
        };

    }

    return next( currentState );

}
