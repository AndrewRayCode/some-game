import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import p2 from 'p2';
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
        assetsLoaded: state.assetsLoaded,
        assetsLoading: state.assetsLoading,
        fonts: state.fonts,
        assets: state.assets,
    }),
    dispatch => bindActionCreators({
        loadAllAssets, deserializeLevels,
    }, dispatch )
)
export default class GameContainer extends Component {

    static contextTypes = {
        store: PropTypes.object.isRequired
    }

    componentDidMount() {

        const {
            assetsLoaded, assetsLoading,
            deserializeLevels: deserialize,
            loadAllAssets: loadAll,
        } = this.props;

        window.THREE = THREE;
        window.p2 = p2;

        if( !assetsLoaded && !assetsLoading ) {
            deserialize();
            loadAll();
        }

    }

    render() {

        const { fonts, assets } = this.props;

        if( !__CLIENT__ ||
                !( 'Sniglet Regular' in fonts ) ||
                !( 'charisma' in assets ) ||
                !( 'eye' in assets )
            ) {
            return <div>Loading&hellip;</div>;
        }

        return <GameGUI store={ this.context.store } />;

    }

}
