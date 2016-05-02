import React, { Component, PropTypes } from 'react';
import styles from './SpeechBubble.scss';
import { easeInBounce, easeOutBounce, } from 'easing-utils';

const percentOpacityTween = 0.4;

const SpeechBubble = ({ isClosing, openPercent, gameWidth, gameHeight, text, position, offset }) => {

    const percent = ( openPercent || 0 ) * 0.9 + 0.1;
    const width = 100 * ( isClosing ?
        easeInBounce( percent ) :
        easeOutBounce( percent )
    );

    return <div
        className={ styles.bubble }
        style={{
            opacity: Math.min( ( openPercent || 0 ) / percentOpacityTween, 1 ),
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
