import KeyCodes from '../helpers/KeyCodes';
import { lerpVectors } from '../helpers/Utils';
import { easeOutQuint, } from '../helpers/easing';

const levelTransitionDuration = 500;

export default function debugSizeReducer( actions, props, oldState, currentState, next ) {

    const {
        currentTransitionStartTime, startTransitionPosition,
        currentTransitionTarget, advanceToNextChapter,
        transitionCameraPositionStart, currentTransitionCameraTarget,
        isAdvancing
    } = oldState;

    const { scalePlayer } = actions;

    const { playerRadius, playerDensity, currentLevelId, } = props;

    const { keysDown, playerPositionV3, time, } = currentState;

    if( isAdvancing ) {

        const newState = {};
        const transitionPercent = Math.min(
            ( ( time - currentTransitionStartTime ) * 1000 ) / levelTransitionDuration,
            1
        );

        newState.currentTransitionPosition = startTransitionPosition
            .clone()
            .lerp( currentTransitionTarget, transitionPercent );

        newState.cameraPosition = lerpVectors(
            transitionCameraPositionStart,
            currentTransitionCameraTarget,
            transitionPercent,
            easeOutQuint
        );

        if( transitionPercent === 1 ) {

            // todo look at this later
            setTimeout( () =>
                actions.advanceChapter( advanceToNextChapter ),
                0
            );

        }

        return {
            ...currentState,
            ...newState
        };

    }

    return next( currentState );

}
