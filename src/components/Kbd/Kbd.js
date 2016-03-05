import React, { Component, PropTypes } from 'react';
import styles from './Kbd.scss';

const Kbd = ( props ) => <span className={ styles.kbd }>
    { props.children }
</span>;

export default Kbd;
