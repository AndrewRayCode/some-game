import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { bindActionCreators } from 'redux';
import {
    areBooksLoaded, loadAllBooks, deserializeLevels
} from '../../redux/modules/editor';
import { areAssetsLoaded, loadAllAssets } from '../../redux/modules/assets';
import {
    scalePlayer, advanceChapter, startGame, stopGame
} from '../../redux/modules/game';

import { getSphereMass } from '../../helpers/Utils';

import GameRenderer from './GameRenderer';
import { TitleScreen, Resources, PausedScreen } from '../../components';

import { resourceIds, allResources } from '../../resources';

import styles from './Game.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind( styles );

import shaderFrog from '../../helpers/shaderFrog';
import MouseInput from '../../helpers/MouseInput';
import UpdateAllObjects from '../../helpers/UpdateAllObjects';

const gameWidth = 400;
const gameHeight = 400;

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
    state => {

        const {
            entities: allEntities,
            chapters: allChapters,
            levels, entities, books,
        } = state.game;

        const {
            gameChapterData,
            currentGameBook: currentBookId,
            assets, fonts, letters
        } = state;

        // No game has been started yet!
        if( !gameChapterData.currentChapterId ) {

            return {
                books: state.books,
                chapters: state.chapters,
                levels: state.levels,
                entities: state.entities,
                fonts, letters,
            };

        }

        const {
            previousChapterId, currentChapterId, previousChapterNextChapter
        } = gameChapterData;

        // Levels and entities
        const currentChapter = allChapters[ currentChapterId ];
        const { levelId: currentLevelId } = currentChapter;
        const currentLevel = levels[ currentLevelId ];

        const {
            currentLevelAllEntities,
            currentLevelStaticEntities,
            currentLevelRenderableEntities,
            currentLevelMovableEntities,
            currentLevelTouchyArray,
        } = currentLevel.entityIds.reduce( ( memo, id ) => {

            const entity = allEntities[ id ];
            memo.currentLevelAllEntities[ id ] = entity;

            if( entity.type === 'shrink' || entity.type === 'grow' || entity.type === 'finish' ) {
                memo.currentLevelTouchyArray = [
                    ...memo.currentLevelTouchyArray, entity
                ];
                // needs to go into static to render
                memo.currentLevelRenderableEntities[ id ] = entity;
            } else if( entity.type === 'pushy' ) {
                memo.currentLevelMovableEntities[ id ] = entity;
            // walls, floors, etc
            } else {
                memo.currentLevelStaticEntities[ id ] = entity;
                memo.currentLevelRenderableEntities[ id ] = entity;
            }

            return memo;

        }, {
            currentLevelRenderableEntities: {},
            currentLevelMovableEntities: {},
            currentLevelAllEntities: {},
            currentLevelStaticEntities: {},
            currentLevelTouchyArray: [],
        });

        // Books and chapters

        const currentBook = books[ currentBookId ];
        const { chapterIds } = currentBook;
        const currentChapters = chapterIds.reduce(
            ( memo, id ) => ({ ...memo, [ id ]: allChapters[ id ] }),
            {}
        );
        const currentChaptersArray = Object.values( currentChapters );

        let previousChapterEntities;
        let previousChapterEntity;
        let previousChapterFinishData;
        let previousChapterFinishEntity;
        let previousChapter;

        const nextChapters = currentChapter.nextChapters;

        if( previousChapterId ) {

            previousChapter = allChapters[ previousChapterId ];

            const previousLevel = levels[ previousChapter.levelId ];
            previousChapterEntities = previousLevel.entityIds.map(
                id => allEntities[ id ]
            );

            const { position, scale } = previousChapterNextChapter;
            const isPreviousChapterBigger = scale.x > 1;
            const multiplier = isPreviousChapterBigger ? 0.125 : 8;

            previousChapterEntity = {
                scale: new THREE.Vector3(
                    multiplier, multiplier, multiplier
                ),
                position: position
                    .clone()
                    .multiply(
                        new THREE.Vector3( -multiplier, multiplier, -multiplier )
                    )
                    .setY( isPreviousChapterBigger ? 0.875 : -7 )
            };

            previousChapterFinishData = previousLevel.entityIds
                .map( id => allEntities[ id ] )
                .find( entity => entity.type === 'finish' );

            previousChapterFinishEntity = {
                ...previousChapterFinishData,
                scale: previousChapterFinishData.scale
                    .clone()
                    .multiplyScalar( multiplier ),
                position: previousChapterFinishData.position.clone().add(
                    previousChapterFinishData.position
                        .clone()
                        .multiplyScalar( multiplier )
                )
            };

            currentLevelTouchyArray.push( previousChapterFinishEntity );

        }

        // Index all next chapter entities by chapter id
        let nextChaptersEntities;
        if( nextChapters ) {

            nextChaptersEntities = nextChapters.reduce(
                ( memo, nextChapter ) => ({
                    ...memo,
                    [ nextChapter.chapterId ]: levels[
                            allChapters[ nextChapter.chapterId ].levelId
                        ].entityIds.map( id => allEntities[ id ] )
                }),
                {}
            );

        }

        return {
            levels, currentLevel, currentLevelId, currentChapterId,
            currentLevelAllEntities, currentLevelStaticEntities, allEntities,
            nextChaptersEntities, assets, fonts, letters,
            currentLevelStaticEntitiesArray: Object.values( currentLevelStaticEntities ),
            currentLevelTouchyArray, nextChapters, previousChapterEntities,
            previousChapterFinishEntity, previousChapterEntity,
            previousChapter, previousChapterNextChapter,
            currentLevelMovableEntities,
            currentLevelMovableEntitiesArray: Object.values( currentLevelMovableEntities ),
            currentLevelRenderableEntities,
            currentLevelRenderableEntitiesArray: Object.values( currentLevelRenderableEntities ),

            gameStarted: true,
            recursionBusterId: state.game.recursionBusterId,
            playerPosition: state.game.playerPosition,
            playerRadius: state.game.playerRadius,
            playerScale: state.game.playerScale,
            playerDensity: state.game.playerDensity,
            pushyDensity: state.game.pushyDensity,
            playerMass: getSphereMass(
                state.game.playerDensity, state.game.playerRadius
            )
        };

    },
    dispatch => bindActionCreators({
        scalePlayer, advanceChapter, loadAllAssets, deserializeLevels,
        startGame, stopGame
    }, dispatch )
)
export default class GameGUI extends Component {

    constructor( props, context ) {

        super( props, context );
        this.state = {};
        this.selectBook = this.selectBook.bind( this );
        this.onExitToTitle = this.onExitToTitle.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this._onRenderUpdate = this._onRenderUpdate.bind( this );
        this.onClickRegionLeave = this.onClickRegionLeave.bind( this );
        this.onClickRegionEnter = this.onClickRegionEnter.bind( this );
        this.createMouseInput = this.createMouseInput.bind( this );
        this.onPause = this.onPause.bind( this );
        this.onUnpause = this.onUnpause.bind( this );
        this.onBeforeRender = this.onBeforeRender.bind( this );
        this.onWindowBlur = this.onWindowBlur.bind( this );

    }

    componentDidMount() {

        window.addEventListener( 'blur', this.onWindowBlur );

    }

    componentWillUnmount() {

        window.removeEventListener( 'blur', this.onWindowBlur );

    }

    onWindowBlur() {

        if( this.props.gameStarted && !this.state.paused ) {

            this.onPause();

        }

    }

    componentDidUpdate( prevProps, prevState ) {

        //if( prevProps.gameStarted !== this.props.gameStarted ||
            //prevState.paused !== this.state.paused
        //) {

            //const { titleScreen, gameRenderer, pauseScreen } = this.refs;
            //const camera = pauseScreen ?
                //pauseScreen.refs.camera : (
                    //titleScreen ?
                    //titleScreen.refs.camera :
                    //gameRenderer.refs.camera
                //);

            //this.state.mouseInput._camera = camera;

        //}

    }

    selectBook( book ) {

        this.setState({ hovered: false });
        const { levels, entities, books, chapters } = this.props;
        this.props.startGame(
            book.id, book.chapterIds[ 0 ], levels, entities, books, chapters
        );

    }

    onExitToTitle() {

        this.setState({ paused: false });
        this.props.stopGame();

    }

    createMouseInput() {

        const { mouseInput, titleScreen, gameRenderer } = this.refs;

        if( mouseInput && !mouseInput.isReady() ) {

            const { scene, container } = this.refs;
            const camera = titleScreen ?
                titleScreen.refs.camera :
                gameRenderer.refs.camera;

            mouseInput.ready( scene, container, camera );
            mouseInput.setActive( false );

        }

        if( this.state.mouseInput !== mouseInput ) {

            this.setState({ mouseInput });

        }

    }

    // Any global updates we can do, do here
    _onAnimate() {
        
        const {
            mouseInput,  titleScreen, gameRenderer, pauseScreen
        } = this.refs;

        const { _fps } = this.state;
        const newState = {};

        const now = Date.now();

        if( !this.lastCalledTime ) {
           this.lastCalledTime = now;
           this.counter = 0;
           newState._fps = 0;
        } else {
            const smoothing = 0.9;
            const delta = ( now - this.lastCalledTime ) / 1000;
            this.lastCalledTime = now;

            newState._fps = Math.round(
                ( ( 1 / delta ) * smoothing ) + ( _fps * ( 1.0 - smoothing ) )
            );

            if( !( this.counter++ % 15 ) ) {
                newState.fps = newState._fps;
            }
        }

        this.setState( newState );

        if( mouseInput ) {
           
           if( !mouseInput.isReady() ) {

                this.createMouseInput();

            }

            const camera = pauseScreen ?
                pauseScreen.refs.camera : (
                    titleScreen ?
                    titleScreen.refs.camera :
                    gameRenderer.refs.camera
                );
            mouseInput._camera = camera;

        }

    }

    _onRenderUpdate( renderer ) {

        if( !this.state.renderer ) {

            this.setState({ renderer });

        }

    }

    onClickRegionLeave() {

        this.setState({ clickable: false });

    }

    onClickRegionEnter() {

        this.setState({ clickable: true });

    }

    onPause() {

        this.setState({ clickable: false, paused: true });

    }

    onUnpause() {

        this.setState({ clickable: false, paused: false });

    }

    onBeforeRender() {

        const { renderer } = this.state;
        if( renderer ) {
            renderer.clearDepth();
        }

    }

    render() {

        const { fps, mouseInput, clickable, paused, } = this.state;

        const {
            playerScale, playerMass, gameStarted, books, fonts, letters,
        } = this.props;

        const react3 = <React3
            ref="renderer"
            mainCamera="camera"
            width={ gameWidth }
            height={ gameHeight }
            onAnimate={ this._onAnimate }
            onRendererUpdated={ this._onRenderUpdate }
        >

            <module
                ref="mouseInput"
                descriptor={ MouseInput }
            />
            <module
                descriptor={ UpdateAllObjects }
            />

            <Resources store={ this.props.store } />

            <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="mainCamera"
            />

            { paused ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="pausedCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            <scene ref="scene">

                <ambientLight
                    color={ 0x777777 }
                />

                <directionalLight
                    color={ 0xffffff }
                    intensity={ 1.0 }
                    castShadow
                    position={ new THREE.Vector3( 0, 5, 0 ) }
                />

                { gameStarted ?
                    <GameRenderer
                        { ...this.props }
                        paused={ paused }
                        ref="gameRenderer"
                        onPause={ this.onPause }
                        onUnpause={ this.onUnpause }
                        onExitToTitle={ this.onExitToTitle }
                        onClickRegionLeave={ this.onClickRegionLeave }
                        onClickRegionEnter={ this.onClickRegionEnter }
                        fonts={ fonts }
                        letters={ letters }
                        mouseInput={ mouseInput }
                    /> : <TitleScreen
                        ref="titleScreen"
                        onClickRegionLeave={ this.onClickRegionLeave }
                        onClickRegionEnter={ this.onClickRegionEnter }
                        mouseInput={ mouseInput }
                        fonts={ fonts }
                        letters={ letters }
                        onSelect={ this.selectBook }
                        books={ Object.values( books ) }
                    />
                }
                { paused ? <PausedScreen
                    ref="pauseScreen"
                    mouseInput={ mouseInput }
                    onUnpause={ this.onUnpause }
                    onReturnToMenu={ this.onExitToTitle }
                    fonts={ fonts }
                    letters={ letters }
                /> : null }

            </scene>

        </React3>;

        return <div
            ref="container"
            className={ cx({ clickable }) }
            style={{
                width: gameWidth,
                height: gameHeight,
            }}
        >
            { react3 }
            <br />
            FPS: { fps }
            <br />
            Player Scale: <input readOnly value={ playerScale } type="text" />
            <br />
            Player Mass: <input readOnly value={ playerMass } type="text" />
        </div>;

    }

}
