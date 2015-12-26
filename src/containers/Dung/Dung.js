import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startGame, endGame } from '../../redux/modules/game';
import THREE from 'three.js';
import Editor from './Editor';
import Game from '../Game/Game';

@connect(
    state => ({ entities: state.editor }),
    dispatch => bindActionCreators( { startGame, endGame }, dispatch )
)
export default class Dung extends Component {

    constructor( props, context ) {

        super( props, context );

        this.state = {
            type: 'editor'
        };

        this.onGameEnd = this.onGameEnd.bind( this );
        this.onEditorSwitch = this.onEditorSwitch.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {

            window.THREE = THREE;
            this.setState({ isClient: true });

        }

    }

    onGameEnd() {

        this.props.endGame();
        this.setState({ type: 'editor' });

    }

    onEditorSwitch() {

        this.props.startGame( this.props.entities );
        this.setState({ type: 'game' });

    }

    render() {

        if ( !this.state.isClient ) {
            return <div />;
        }

        const { type } = this.state;

        return <div>
            { type === 'editor' ? <Editor
                onEditorSwitch={ this.onEditorSwitch }
            /> : <Game
                onGameEnd={ this.onGameEnd }
            /> }
        </div>;

    }

}
