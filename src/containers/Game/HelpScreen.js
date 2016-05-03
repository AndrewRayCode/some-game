import React, { Component, PropTypes } from 'react';

import { Kbd, } from 'components';

import styles from './Game.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind( styles );

export default class HelpScreen extends Component {

    render() {
        return <div>
            <b>Keys:</b>
            <br />
            <ul>
                <li>
                    <b>Select</b> <Kbd>Enter</Kbd>
                </li>
                <li>
                    <b>Move</b>
                    <Kbd>←</Kbd>
                    <Kbd>↑</Kbd>
                    <Kbd>→</Kbd>
                    <Kbd>↓</Kbd>
                    &nbsp;or&nbsp;
                    <Kbd>W</Kbd>
                    <Kbd>A</Kbd>
                    <Kbd>S</Kbd>
                    <Kbd>D</Kbd>
                </li>
                <li>
                    <b>Jump</b> <Kbd>Space</Kbd>
                </li>
                <li>
                    <b>Pause Game</b> <Kbd>P</Kbd> or <Kbd>Esc</Kbd>
                </li>
                <li>
                    <b>Zoom in on Charisma</b> <Kbd>K</Kbd>
                </li>
                <li>
                    <b>See Whole Level</b> <Kbd>L</Kbd>
                </li>
            </ul>
        </div>;
    }

}
