import { Kbd } from 'components';
import React from 'react';

const textExpandTime = 1100;
const textCloseTime = 500;
const msPerLetter = 35;

function generateText( text:string, index:number ) {
    return <span>
        { text.substr( 0, index, ) }
        { index >= text.length ? <span>&nbsp;<Kbd green>Enter</Kbd></span> : null }
    </span>;
}

export default function speechReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        textQueue: oldTextQueue,
        textVisibleStartTime: oldTextVisibleStartTime,
        textIsVisible: oldTextIsVisible,
        activeTextStartTime: oldActiveTextStartTime,
        textCloseStartTime: oldTextCloseStartTime,
        textIsClosing: oldTextIsClosing,
    } = oldState;

    const { time, } = currentState;

    let newState = {};

    let textVisibleStartTime = oldTextVisibleStartTime;
    let textIsVisible = oldTextIsVisible;
    let activeTextStartTime = oldActiveTextStartTime;
    let textQueue = currentState.textQueue || oldTextQueue || [];
    let textCloseStartTime = oldTextCloseStartTime;
    let textIsClosing = oldTextIsClosing;

    // Is there text to display?
    if( !textCloseStartTime && textQueue.length ) {

        textIsVisible = true;

        const currentText = textQueue[ 0 ];

        // Is the text box closed?
        if( !textVisibleStartTime ) {

            textVisibleStartTime = time;

        }

        // If the text box isn't fully open yet, finish animating it
        const timeSinceTextVisible = time - textVisibleStartTime;
        newState.textOpenPercent = Math.min( timeSinceTextVisible / textExpandTime, 1 );

        // When the box finishes opening, note the current time
        if( !activeTextStartTime && newState.textOpenPercent === 1 ) {

            newState.textOpenPercent = 1;
            activeTextStartTime = time;

        }

        // Otherwise tween the text display based on the time elapsed
        if( activeTextStartTime ) {

            const currentTextIndex = Math.min(
                Math.round( ( ( time - activeTextStartTime ) / msPerLetter ) ),
                currentText.length
            );
            newState.currentTextPercent = currentTextIndex / currentText.length;
            newState.visibleText = generateText( currentText, currentTextIndex );
            const isFullyShown = currentTextIndex >= currentText.length;

            // If not fully shown, it's skippable
            if( !isFullyShown ) {

                if( keysDown.isFirstPress( 'SPACE' ) || keysDown.isFirstPress( 'ENTER' ) ) {
                    activeTextStartTime = 1; // A truty value a long time in the past
                    newState.visibleText = generateText( currentText, Infinity );
                }

            // Else do next text condition
            } else if( isFullyShown && keysDown.isFirstPress( 'ENTER' ) ) {

                textQueue = textQueue.slice( 1 );

                // No more text? close
                if( !textQueue.length ) {
                    newState.visibleText = '';
                    textCloseStartTime = time;
                    textIsClosing = true;

                // More text? set new active time
                } else {
                    activeTextStartTime = time;
                }

            }

        }

    }

    // Otherwise is the text box still open? animate it closed
    if( textCloseStartTime ) {

        const timeSinceTextClosing = time - textCloseStartTime;
        newState.textOpenPercent = 1 - ( timeSinceTextClosing / textCloseTime );

        // Reset everything
        if( newState.textOpenPercent <= 0 ) {

            textQueue = textQueue.slice( 1 );
            textCloseStartTime = null;
            textIsVisible = false;
            textIsClosing = false;
            newState.textOpenPercent = 0;
            activeTextStartTime = null;
            textVisibleStartTime = null;

        }

    }

    newState = {
        ...newState,
        textVisibleStartTime, textIsVisible, activeTextStartTime, textQueue,
        textCloseStartTime, textIsClosing,
    };

    return next({
        ...currentState,
        ...newState
    });

}
