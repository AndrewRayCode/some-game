import 'babel/polyfill';
import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startGame, endGame } from '../../redux/modules/game';
import { areLevelsLoaded, loadAllData } from '../../redux/modules/editor';
import { loadAsset } from '../../redux/modules/assets';
import connectData from '../../helpers/connectData';
import THREE from 'three';
import Editor from './Editor';
import Game from '../Game/Game';

function fetchData( getState, dispatch ) {
    const promises = [];
    if( !areLevelsLoaded( getState() ) ) {
        promises.push( dispatch( loadAllData() ) );
    }
    return Promise.all( promises );
}

@connectData( fetchData )
@connect(
    state => ({
        levels: state.levels,
        entities: state.entities,
        currentLevelId: state.currentEditorLevel
    }),
    dispatch => bindActionCreators( { startGame, endGame, loadAsset }, dispatch )
)
export default class Dung extends Component {

    constructor( props, context ) {

        super( props, context );

        this.state = {
            type: 'editor',
            isClient: false
        };

        this.onGameEnd = this.onGameEnd.bind( this );
        this.onEditorSwitch = this.onEditorSwitch.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {

            console.log( 'LOL', process.ENV );
            window.THREE = THREE;
            this.setState({ isClient: true });
            this.props.loadAsset( require( '../../../assets/houseSF.obj' ), { name: 'house' } );

        }

    }

    onGameEnd() {

        this.props.endGame();
        this.setState({ type: 'editor' });

    }

    onEditorSwitch() {

        this.props.startGame( this.props.currentLevelId, this.props.levels, this.props.entities );
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
