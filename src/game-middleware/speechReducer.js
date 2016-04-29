const textExpandTime = 1000;
const msPerLetter = 500;

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
    } = oldState;

    const { time, } = currentState;

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

            textVisibleStartTime = time;

        }

        // If the text box isn't fully open yet, finish animating it
        const timeSinceTextVisible = time - textVisibleStartTime;
        if( timeSinceTextVisible < textExpandTime ) {

            newState.textOpenPercent = timeSinceTextVisible / textVisibleStartTime;

            // When the box finishes opening, note the current time
            if( newState.textOpenPercent >= 1 ) {

                newState.textOpenPercent = null;
                activeTextStartTime = time;

            }

        }

        // Otherwise tween the text display based on the time elapsed
        if( activeTextStartTime ) {

            const currentTextIndex = Math.min(
                Math.round( ( ( time - activeTextStartTime ) / msPerLetter ) ),
                currentText.length
            );
            const isFullyShown = currentTextIndex >= currentText.length;
            newState.visibleText = currentText.substr( 0, currentTextIndex, ) + ( isFullyShown ? ' [Enter]' : '' );

            // Next text condition! Remove the first (active) queue
            if( isFullyShown && keysDown.isFirstPressed( 'ENTER' ) ) {

                textQueue = textQueue.slice( 1 );
                textCloseStartTime = time;

            }

        }

    }

    // Otherwise is the text box still open? animate it closed
    if( textCloseStartTime ) {

        const timeSinceTextClosing = time - textCloseStartTime;
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

    return next({
        ...currentState,
        ...newState
    });

}
