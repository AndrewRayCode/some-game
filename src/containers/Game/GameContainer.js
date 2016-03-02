import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { bindActionCreators } from 'redux';
import {
    areBooksLoaded, loadAllBooks, deserializeLevels
} from '../../redux/modules/editor';
import { loadAllAssets } from '../../redux/modules/assets';

import GameGUI from './GameGUI';

// Determines server and client side rendering and calling initial data loading
@asyncConnect([{
    promise: ({ store: { dispatch, getState } }) => {
        const promises = [];
        if( !areBooksLoaded( getState() ) ) {
            promises.push( dispatch( loadAllBooks() ) );
        }
        return Promise.all( promises );
    }
}])
@connect(
    state => ({
        levels: state.levels,
        chapters: state.chapters,
        books: state.books,
        assets: state.assets,
        shaders: state.shaders,
        assetsLoaded: state.assetsLoaded,
    }),
    dispatch => bindActionCreators({
        loadAllAssets, deserializeLevels,
    }, dispatch )
)
export default class GameContainer extends Component {

    constructor( props, context ) {

        super( props, context );
        this.state = {};

    }

    componentDidMount() {

        // Hack to to client side *only* actions
        this.clientSet = setTimeout( () => {

            if( !this.props.assetsLoaded ) {
                this.props.deserializeLevels();
                this.props.loadAllAssets();
            }


            this.setState({ isClient: true });

        }, 0 );

    }

    componentWillUnmount() {

        window.clearTimeout( this.clientSet );

    }


    render() {

        return <GameGUI isClient={ this.state.isClient } />;

    }

}
