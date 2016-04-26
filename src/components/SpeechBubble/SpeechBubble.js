import React, { Component, PropTypes } from 'react';
import styles from './SpeechBubble.scss';

const SpeechBubble = ({ gameWidth, gameHeight, text, position, offset }) => <div
    className={ styles.bubble }
    style={{
        top: `${ Math.round( position.y ) + offset }px`,
    }}
>
    <div
        className={ styles.arrowUp }
        style={{
            left: `${ Math.round( position.x ) }px`,
        }}
    />
    <div className={ styles.bubbleBackground } />
    <div className={ styles.bubbleContents }>
        { text }
    </div>
</div>;

export default SpeechBubble;
