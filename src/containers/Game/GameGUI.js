import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { bindActionCreators } from 'redux';
import {
    areBooksLoaded, loadAllBooks, deserializeLevels
} from '../../redux/modules/editor';
import { loadAllAssets } from '../../redux/modules/assets';
import {
    scalePlayer, advanceChapter, startGame, stopGame, restartChapter
} from '../../redux/modules/game';

import { getSphereMass, without } from '../../helpers/Utils';
import KeyCodes from '../../helpers/KeyCodes';

import GameRenderer from './GameRenderer';
import {
    TitleScreen, GameResources, PausedScreen, ConfirmRestartScreen, Kbd,
    TransitionScreen
} from '../../components';

import styles from './Game.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind( styles );

import shaderFrog from '../../helpers/shaderFrog';
import MouseInput from '../../helpers/MouseInput';
import UpdateAllObjects from '../../helpers/UpdateAllObjects';

const gameWidth = 400;
const gameHeight = 400;
const transitionFadeMs = 750;

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
            levels, books, chapters,
        } = state.game;

        const {
            gameChapterData,
            levels: originalLevels,
            entities: originalEntities,
            assets, fonts, letters
        } = state;

        // No game has been started yet!
        if( !gameChapterData.currentChapterId ) {

            return {
                books: state.books,
                chapters: state.chapters,
                originalLevels,
                originalEntities,
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
            // Things like waterfalls with no physical geometry
            } else if( entity.type === 'waterfall' ) {
                memo.currentLevelRenderableEntities[ id ] = entity;
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
            nextChaptersEntities, assets, fonts, letters, originalLevels,
            originalEntities, books, chapters,
            currentLevelStaticEntitiesArray: Object.values( currentLevelStaticEntities ),
            currentLevelTouchyArray, nextChapters, previousChapterEntities,
            previousChapterFinishEntity, previousChapterEntity,
            previousChapter, previousChapterNextChapter,
            currentLevelMovableEntities,
            currentLevelMovableEntitiesArray: Object.values( currentLevelMovableEntities ),
            currentLevelRenderableEntities,
            currentLevelRenderableEntitiesArray: Object.values( currentLevelRenderableEntities ),

            gameStarted: true,
            restartBusterId: state.game.restartBusterId,
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
        startGame, stopGame, restartChapter
    }, dispatch )
)
export default class GameGUI extends Component {

    constructor( props, context ) {

        super( props, context );

        this.state = {};
        this.keysDown = {};

        this.selectBook = this.selectBook.bind( this );
        this.onExitToTitle = this.onExitToTitle.bind( this );
        this.onConfirmRestart = this.onConfirmRestart.bind( this );
        this.onDenyRestart = this.onDenyRestart.bind( this );
        this._onAnimate = this._onAnimate.bind( this );
        this._onRenderUpdate = this._onRenderUpdate.bind( this );
        this.onClickRegionLeave = this.onClickRegionLeave.bind( this );
        this.onClickRegionEnter = this.onClickRegionEnter.bind( this );
        this.createMouseInput = this.createMouseInput.bind( this );
        this.onPause = this.onPause.bind( this );
        this.onUnpause = this.onUnpause.bind( this );
        this.onShowConfirmRestartScreen = this.onShowConfirmRestartScreen.bind( this );
        this.onBeforeRender = this.onBeforeRender.bind( this );
        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );
        this.pauseKeyListeningUntilKeyUp = this.pauseKeyListeningUntilKeyUp.bind( this );
        this.unpauseKeyListening = this.unpauseKeyListening.bind( this );

    }

    componentDidMount() {

        window.addEventListener( 'blur', this.onWindowBlur );
        window.addEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.onKeyUp );

    }

    componentWillUnmount() {

        window.removeEventListener( 'blur', this.onWindowBlur );
        window.removeEventListener( 'keydown', this.onKeyDown );
        window.removeEventListener( 'keyup', this.onKeyUp );

    }

    componentWillReceiveProps( nextProps ) {

        const { elapsedTime } = this.state;

        if( nextProps.recursionBusterId !== this.props.recursionBusterId ) {

            this.setState({ transitionFadeStartTime: elapsedTime });

        } else if( nextProps.restartBusterId !== this.props.restartBusterId ) {

            this.setState({ transitionFadeStartTime: elapsedTime });

        }

    }

    onKeyDown( event ) {

        const which = { [ event.which ]: true };

        if( event.which === KeyCodes.SPACE ||
                event.which === KeyCodes.UP ||
                event.which === KeyCodes.DOWN
            ) {
            event.preventDefault();
        }

        this.keysDown = Object.assign( {}, this.keysDown, which );

    }

    onKeyUp( event ) {

        this.keysDown = without( this.keysDown, event.which );

    }

    onWindowBlur() {

        this.keysDown = {};

        if( this.props.gameStarted && !this.state.paused ) {

            this.onPause();

        }

    }

    selectBook( book ) {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
        });
        const {
            originalLevels, originalEntities, books, chapters
        } = this.props;

        this.props.startGame(
            book.id, book.chapterIds[ 0 ], originalLevels, originalEntities, books, chapters
        );

    }

    onExitToTitle() {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
        });
        this.props.stopGame();

    }

    onConfirmRestart() {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
        });

        const {
            currentChapterId, originalEntities, originalLevels, chapters, books
        } = this.props;

        this.props.restartChapter(
            currentChapterId, originalEntities, originalLevels, chapters, books
        );

    }

    onDenyRestart() {

        this.setState({
            clickable: false,
            paused: true,
            confirmRestart: false,
        });

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
    _onAnimate( elapsedTime, delta ) {
        
        const {
            mouseInput, titleScreen, gameRenderer, pauseScreen
        } = this.refs;

        const { gameStarted } = this.props;
        const {
            _fps, paused, confirmRestart, transitionFadeStartTime
        } = this.state;
        const { keysDown } = this;
        const newState = { elapsedTime, delta };

        if( transitionFadeStartTime ) {

            newState.transitionFadeAlpha = Math.max(
                0.7 - ( ( ( elapsedTime - transitionFadeStartTime ) * 1000 ) / transitionFadeMs ),
                0
            );

            if( newState.transitionFadeAlpha === 0 ) {

                newState.transitionFadeStartTime = null;
                newState.transitionFadeAlpha = null;

            }

        }

        shaderFrog.updateShaders( elapsedTime, {
            uniforms: { transitionAlpha: newState.transitionFadeAlpha }
        });

        if( !this.lastCalledTime ) {
           this.lastCalledTime = elapsedTime;
           this.counter = 0;
           newState._fps = 0;
        } else {
            const smoothing = 0.9;
            this.lastCalledTime = elapsedTime;

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

        if( gameStarted && paused ) {

            if( confirmRestart ) {

                if( KeyCodes.ESC in keysDown ) {

                    this.pauseKeyListeningUntilKeyUp();
                    this.onDenyRestart();

                } else if( KeyCodes.ENTER in keysDown ) {

                    this.pauseKeyListeningUntilKeyUp();
                    this.onConfirmRestart();

                }

            } else {

                if(
                    ( KeyCodes.ESC in keysDown ) || ( KeyCodes.P in keysDown ) ||
                        ( KeyCodes.SPACE in keysDown )
                ) {

                    this.pauseKeyListeningUntilKeyUp();
                    this.onUnpause();

                } else if( KeyCodes.M in keysDown ) {

                    this.pauseKeyListeningUntilKeyUp();
                    this.onExitToTitle();

                }

            }

        } else if( gameStarted ) {

            if( ( KeyCodes.ESC in keysDown ) || ( KeyCodes.P in keysDown ) ) {

                this.pauseKeyListeningUntilKeyUp();
                this.onPause();

            } else if( KeyCodes.R in keysDown ) {

                this.pauseKeyListeningUntilKeyUp();
                this.onShowConfirmRestartScreen();

            }

        }

    }

    pauseKeyListeningUntilKeyUp() {

        this.keysDown = {};
        window.removeEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.unpauseKeyListening );

    }

    unpauseKeyListening() {

        window.addEventListener( 'keydown', this.onKeyDown );
        window.removeEventListener( 'keyup', this.unpauseKeyListening );

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

        this.setState({
            clickable: false,
            paused: true,
            confirmRestart: false,
        });

    }

    onUnpause() {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
        });

    }

    onShowConfirmRestartScreen() {

        this.setState({
            clickable: false,
            paused: true,
            confirmRestart: true,
        });

    }

    onBeforeRender() {

        const { renderer } = this.state;
        if( renderer ) {
            renderer.clearDepth();
        }

    }

    render() {

        const {
            fps, mouseInput, clickable, paused, confirmRestart,
        } = this.state;

        const {
            playerScale, playerMass, gameStarted, books, fonts, letters,
        } = this.props;

        const react3 = <React3
            ref="renderer"
            mainCamera="camera"
            width={ gameWidth }
            height={ gameHeight }
            onRendererUpdated={ this._onRenderUpdate }
        >

            <module
                ref="mouseInput"
                descriptor={ MouseInput }
            />
            <module
                descriptor={ UpdateAllObjects }
            />

            <GameResources store={ this.props.store } />

            <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="mainCamera"
            />

            { confirmRestart ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="confirmRestartCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { !confirmRestart && paused ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="pausedCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="transitionCamera"
                onBeforeRender={ this.onBeforeRender }
            />

            <scene ref="scene"
                onUpdate={ this._onAnimate }
            >

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

                { gameStarted && !confirmRestart && paused ? <PausedScreen
                    ref="pauseScreen"
                    mouseInput={ mouseInput }
                    onClickRegionLeave={ this.onClickRegionLeave }
                    onClickRegionEnter={ this.onClickRegionEnter }
                    onUnpause={ this.onUnpause }
                    onReturnToMenu={ this.onExitToTitle }
                    onRestart={ this.onShowConfirmRestartScreen }
                    fonts={ fonts }
                    letters={ letters }
                /> : null }

                { gameStarted && confirmRestart ? <ConfirmRestartScreen
                    ref="pauseScreen"
                    mouseInput={ mouseInput }
                    onClickRegionLeave={ this.onClickRegionLeave }
                    onClickRegionEnter={ this.onClickRegionEnter }
                    onConfirm={ this.onConfirmRestart }
                    onDeny={ this.onDenyRestart }
                    fonts={ fonts }
                    letters={ letters }
                /> : null }

            <TransitionScreen />

            </scene>

        </React3>;

        return <div>
            <div
                ref="container"
                className={ cx({ clickable }) }
                style={{
                    width: gameWidth,
                    height: gameHeight,
                }}
            >
                { react3 }
            </div>

            <br />
            <b>Keys:</b>
            <br />
            <Kbd>p</Kbd> or <Kbd>Esc</Kbd> Pause game

            <br />
            <br />
            <b>Shaders</b> by <a href="http://shaderfrog.com/app" target="_blank">ShaderFrog</a>

            <br />
            FPS: { fps }
            <br />
            Player Scale: <input readOnly value={ playerScale } type="text" />
            <br />
            Player Mass: <input readOnly value={ playerMass } type="text" />
        </div>;

    }

}
