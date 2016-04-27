import THREE from 'three';
import { easeInElastic, easeInBounce, easeInOutElastic, easeInBack, easeInExpo } from 'easing-utils';

const emitterVisibleDurationMs = 1000;
const scaleDurationMs = 1000;
// Warning: duplicated in entityInteractionReducer
const scaleStartDelayMs = 250;

const totalScaleDurationSeconds = ( emitterVisibleDurationMs + scaleDurationMs + scaleStartDelayMs ) / 1000;

export default function playerScaleReducer(
    keysDown:Object,
    actions:Object,
    props:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const { playerRadius, } = props;
    const { time, } = currentState;

    const newState = {};

    const scaleStartTime = newState.scaleStartTime || oldState.scaleStartTime || /* from the debugger */currentState.scaleStartTime;
    if( scaleStartTime ) {

        const radiusDiff = oldState.radiusDiff || newState.radiusDiff || currentState.radiusDiff;

        // For the first frame, the scalePlayer() won't have completed, so the
        // radius will be stale, and we need to manually adjust it
        const newPlayerRadius = oldState.radiusDiff ?
            playerRadius :
            playerRadius * ( ( newState.isShrinking || currentState.isShrinking ) ? 0.5 : 2 );

        newState.playerScaleEffectsEnabled = true;
        newState.playerScaleEffectsVisible = true;

        const currentScalePercent = 1 - ( ( Math.max( time - scaleStartTime, 0 ) * 1000 ) / scaleDurationMs );

        const scaleValue = currentScalePercent * radiusDiff;
        newState.scaleValue = scaleValue;
        newState.adjustedPlayerRadius = newPlayerRadius + scaleValue;

        // A multiplier on the player where 0.5 = base scale
        newState.adjustedPlayerScale = new THREE.Vector3(
            newPlayerRadius + easeInBack( THREE.Math.clamp( ( currentScalePercent - 0.25 ) / 0.75, 0, 1 ) ) * radiusDiff,
            newPlayerRadius + easeInExpo( THREE.Math.clamp( ( currentScalePercent - 0.25 ) / 0.75, 0, 1 ) ) * radiusDiff,
            newPlayerRadius + easeInBounce( Math.min( currentScalePercent / 0.75, 1 ) ) * radiusDiff,
        );

        newState.scalingOffsetZ = newState.adjustedPlayerScale.z - newPlayerRadius;

        if( currentScalePercent <= 0 ) {

            newState.isShrinking = null;
            newState.scaleValue = null;
            newState.scalingOffsetZ = null;
            newState.adjustedPlayerScale = null;
            newState.adjustedPlayerRadius = null;
            newState.currentScalePercent = null;
            newState.radiusDiff = null;
            newState.playerScaleEffectsEnabled = false;

            if( time > scaleStartTime + totalScaleDurationSeconds ) {
                newState.playerScaleEffectsEnabled = null;
                newState.playerScaleEffectsVisible = null;
                newState.scaleStartTime = null;
            }

        } else {

            newState.currentScalePercent = currentScalePercent;

        }

    }

    return next({
        ...currentState,
        ...newState
    });

}
