import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import Editor from './Editor';
import Game from '../Game/Game';

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

        this.setState({ type: 'unmount' });
        setTimeout( () => {
            this.setState({ type: 'editor' });
        }, 500 );

    }

    onEditorSwitch() {

        this.setState({ type: 'unmount' });
        setTimeout( () => {
            this.setState({ type: 'game' });
        }, 500 );

    }

    render() {

        if ( !this.state.isClient || this.state.unmount ) {
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
