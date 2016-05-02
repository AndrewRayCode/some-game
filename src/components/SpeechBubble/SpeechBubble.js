import React, { Component, PropTypes } from 'react';
import styles from './SpeechBubble.scss';
import { easeInBounce, easeOutBounce, easeInElastic, } from 'easing-utils';

const percentOpacityTween = 0.4;
const minPercentOpen = 0.3;

const SpeechBubble = ({ isClosing, openPercent = 0, gameWidth, gameHeight, text, position, offset }) => {

    const widthPercent = openPercent * ( 1 - minPercentOpen ) + minPercentOpen;
    const width = 100 * ( isClosing ?
        widthPercent :
        easeOutBounce( widthPercent )
    );

    return <div
        className={ styles.bubble }
        style={{
            opacity: Math.min( openPercent / percentOpacityTween, 1 ),
            top: `${ Math.round( position.y ) + offset }px`,
        }}
    >
        <div
            className={ styles.arrowUp }
            style={{
                left: `${ Math.round( position.x ) }px`,
            }}
        />
        <div
            style={{
                width: `${ width }%`,
                left: `${ 50 - ( width * 0.5 ) }%`,
            }}
            className={ styles.contentWrap }
        >
            <div className={ styles.bubbleBackground } />
            <div className={ styles.bubbleContents }>
                { text }
            </div>
        </div>
    </div>;

};

export default SpeechBubble;
