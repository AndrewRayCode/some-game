import 'babel/polyfill';
import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { startGame, endGame } from '../../redux/modules/game';
import { areLevelsLoaded, loadAllData } from '../../redux/modules/editor';
import { loadAsset, loadShader } from '../../redux/modules/assets';
import connectData from '../../helpers/connectData';
import THREE from 'three';
import Editor from './Editor';
import Game from '../Game/Game';
import ShaderFrogRuntime from 'shaderfrog-runtime';
import CustomShaders from './CustomShaders';

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
        books: state.books,
        chapters: state.chapters,
        currentLevelId: state.currentEditorLevel,
        currentChapterId: state.currentEditorChapter,
        currentBookId: state.currentEditorBook,
    }),
    dispatch => bindActionCreators( { startGame, endGame, loadAsset, loadShader }, dispatch )
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

            window.THREE = THREE;
            this.setState({ isClient: true });
            this.props.loadAsset(
                require( '../../../assets/houseSF.obj' ),
                { name: 'house' }
            );

            const shaderFrog = new ShaderFrogRuntime();
            this.shaderFrog = shaderFrog;

            Object.keys( CustomShaders ).forEach( key => {

                const json = CustomShaders[ key ];
                shaderFrog.add( key, json );

                this.props.loadShader(
                    key, json, shaderFrog.get( 'spaceCubeWall' )
                );

            });

        }

    }

    onGameEnd() {

        this.props.endGame();
        this.setState({ type: 'editor' });

    }

    onEditorSwitch() {

        const {
            currentBookId, currentChapterId, levels, entities, books, chapters
        } = this.props;

        this.props.startGame(
            currentBookId, currentChapterId, levels, entities, books, chapters
        );
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
                shaderFrog={ this.shaderFrog }
            /> : <Game
                onGameEnd={ this.onGameEnd }
                shaderFrog={ this.shaderFrog }
            /> }
        </div>;

    }

}
