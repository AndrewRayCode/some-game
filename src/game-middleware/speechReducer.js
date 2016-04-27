import { lerpVectors } from '../helpers/Utils';
import { easeOutQuint, } from 'easing-utils';

const textExpandTime = 1000;
const msPerLetter = 500;

export default function speechReducer( actions, props, oldState, currentState, next ) {

    const {
        textQueue: oldTextQueue,
        textVisibleStartTime: oldTextVisibleStartTime,
        textIsVisible: oldTextIsVisible,
        activeTextStartTime: oldActiveTextStartTime,
        textCloseStartTime: oldTextCloseStartTime,
    } = oldState;

    const { keysDown, time, } = currentState;
    const timeMs = time * 1000;

    let newState = {};

    let textVisibleStartTime = oldTextVisibleStartTime;
    let textIsVisible = oldTextIsVisible;
    let activeTextStartTime = oldActiveTextStartTime;
    let textQueue = oldTextQueue || [];
    let textCloseStartTime = oldTextCloseStartTime;

    if( keysDown.isFirstPress( 'V' ) ) {
        textQueue = [
            ...textQueue,
            'Some new text that is rather long, you see. Yell at my son.'
        ];
    }

    // Is there text to display?
    if( textQueue.length ) {

        textIsVisible = true;

        const currentText = textQueue[ 0 ];

        // Is the text box closed?
        if( !textVisibleStartTime ) {

            textVisibleStartTime = timeMs;

        }

        // If the text box isn't fully open yet, finish animating it
        const timeSinceTextVisible = timeMs - textVisibleStartTime;
        if( timeSinceTextVisible < textExpandTime ) {

            newState.textOpenPercent = timeSinceTextVisible / textVisibleStartTime;

            // When the box finishes opening, note the current time
            if( newState.textOpenPercent >= 1 ) {

                newState.textOpenPercent = null;
                activeTextStartTime = timeMs;

            }

        }

        // Otherwise tween the text display based on the time elapsed
        if( activeTextStartTime ) {

            const currentTextIndex = Math.min(
                Math.round( ( ( timeMs - activeTextStartTime ) / msPerLetter ) ),
                currentText.length
            );
            const isFullyShown = currentTextIndex >= currentText.length;
            newState.visibleText = currentText.substr( 0, currentTextIndex, ) + ( isFullyShown ? ' [Enter]' : '' );

            // Next text condition! Remove the first (active) queue
            if( isFullyShown && keysDown.isFirstPressed( 'ENTER' ) ) {

                textQueue = textQueue.slice( 1 );
                textCloseStartTime = timeMs;

            }

        }

    }

    // Otherwise is the text box still open? animate it closed
    if( textCloseStartTime ) {

        const timeSinceTextClosing = timeMs - textCloseStartTime;
        newState.textOpenPercent = timeSinceTextClosing / textVisibleStartTime;

        // Reset everything
        if( newState.textOpenPercent <= 0 ) {

            newState.textCloseStartTime = null;
            newState.textIsVisible = false;

        }

    }

    newState = {
        ...newState,
        textVisibleStartTime, textIsVisible, activeTextStartTime, textQueue,
        textCloseStartTime,
    };

    return {
        ...currentState,
        ...newState
    };

}
