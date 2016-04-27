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

import { getSphereMass, without, toScreenPosition } from 'helpers/Utils';
import KeyCodes from 'helpers/KeyCodes';

import GameRenderer from './GameRenderer';
import {
    TitleScreen, GameResources, PausedScreen, ConfirmRestartScreen, Kbd,
    TransitionScreen, ConfirmMenuScreen, SpeechBubble, SpeechScreen,
} from 'components';

import styles from './Game.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind( styles );

import Mediator from 'helpers/Mediator';
import shaderFrog from 'helpers/shaderFrog';
import MouseInput from 'helpers/MouseInput';
import UpdateAllObjects from 'helpers/UpdateAllObjects';

import {
    playerTextureTail, playerTextureLegs, playerTexture,
} from 'ThreeMaterials';

const isSpeech = 1;

const gameWidth = 400;
const gameHeight = 400;
const transitionFadeMs = 1000;
const bubbleOffset = 40;

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
            gameState,
            entities: allEntities,
            chapters: allChapters,
            levels, books, chapters, playerMaterialId,
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
                assets,
                gameState,
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
            currentLevelBridges,
        } = currentLevel.entityIds.reduce( ( memo, id ) => {

            const entity = allEntities[ id ];
            memo.currentLevelAllEntities[ id ] = entity;

            if( entity.type === 'shrink' || entity.type === 'grow' || entity.type === 'finish' ) {
                memo.currentLevelTouchyArray = [
                    ...memo.currentLevelTouchyArray, entity
                ];
                // needs to go into static to render
                memo.currentLevelRenderableEntities[ id ] = entity;
            } else if( entity.movable === true ) {
                memo.currentLevelMovableEntities[ id ] = entity;
            // Things like waterfalls with no physical geometry
            } else if( entity.type === 'waterfall' || entity.type === 'puffer' ) {
                memo.currentLevelRenderableEntities[ id ] = entity;
            // bridges?
            } else if( entity.type === 'bridge' ) {
                memo.currentLevelBridges[ id ] = entity;
                memo.currentLevelRenderableEntities[ id ] = entity;
            // walls, floors, etc
            } else {

                if( entity.touchable !== false ) {
                    memo.currentLevelStaticEntities[ id ] = entity;
                }

                memo.currentLevelRenderableEntities[ id ] = entity;
            }

            return memo;

        }, {
            currentLevelBridges: {},
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
            gameState, levels, currentLevel, currentLevelId, currentChapterId,
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
            currentLevelBridges,
            currentLevelBridgesArray: Object.values( currentLevelBridges ),

            playerMaterialId,
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

        this.state = {
            elapsedTime: 0
        };

        this.selectBook = this.selectBook.bind( this );
        this.onExitToMenuConfirm = this.onExitToMenuConfirm.bind( this );
        this.onExitToMenuDeny = this.onExitToMenuDeny.bind( this );
        this.onShowConfirmMenuScreen = this.onShowConfirmMenuScreen.bind( this );
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

    }

    componentDidMount() {

        window.addEventListener( 'blur', this.onWindowBlur );

    }

    componentWillUnmount() {

        window.removeEventListener( 'blur', this.onWindowBlur );

    }

    componentWillReceiveProps( nextProps ) {

        const { elapsedTime } = this.state;

        if( nextProps.recursionBusterId !== this.props.recursionBusterId ) {

            this.setState({ transitionFadeStartTime: elapsedTime });

        } else if( nextProps.restartBusterId !== this.props.restartBusterId ) {

            this.setState({ transitionFadeStartTime: elapsedTime });

        }

    }

    onWindowBlur() {

        // This is dumb
        if( window.location.href.indexOf( '3000' ) === -1 &&
           this.props.gameStarted && !this.state.paused ) {

            this.onPause();

        }

    }

    selectBook( book ) {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
            confirmMenu: false,
        });
        const {
            originalLevels, originalEntities, books, chapters
        } = this.props;

        this.props.startGame(
            book.id, book.chapterIds[ 0 ], originalLevels, originalEntities, books, chapters
        );

    }

    onExitToMenuConfirm() {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
            confirmMenu: false,
        });
        this.props.stopGame();

    }

    onConfirmRestart() {

        this.setState({
            clickable: false,
            paused: false,
            confirmRestart: false,
            confirmMenu: false,
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
            confirmMenu: false,
        });

    }

    createMouseInput() {

        const { mouseInput, } = this.refs;

        if( mouseInput && !mouseInput.isReady() ) {

            const { scene, container } = this.refs;
            const camera = this._getActiveCameraFromRefs( this.refs );

            mouseInput.ready( scene, container, camera );
            mouseInput.setActive( false );

        }

        if( this.state.mouseInput !== mouseInput ) {

            this.setState({ mouseInput });

        }

    }

    // Determine the camera to use for mouse interaction
    _getActiveCameraFromRefs( refs ) {

        const {
            gameRenderer, titleScreen, pausedScreen, confirmMenuScreen,
            confirmRestartScreen, speechScreen,
        } = refs;

        if( isSpeech && speechScreen ) {
            return speechScreen.refs.camera;
        } else if( titleScreen ) {
            return titleScreen.refs.camera;
        } else if( pausedScreen ) {
            return pausedScreen.refs.camera;
        } else if( confirmMenuScreen ) {
            return confirmMenuScreen.refs.camera;
        } else if( confirmRestartScreen ) {
            return confirmRestartScreen.refs.camera;
        } else if( gameRenderer ) {
            return gameRenderer.refs.camera;
        }

    }

    // Any global updates we can do, do here
    _onAnimate( elapsedTime, delta ) {
        
        const { mouseInput, } = this.refs;

        const { gameStarted } = this.props;
        const {
            _fps, paused, confirmRestart, transitionFadeStartTime, confirmMenu,
        } = this.state;
        const { keysDown } = this;
        const newState = { elapsedTime, delta };

        if( transitionFadeStartTime ) {

            newState.transitionFadeAlpha = Math.max(
                0.6 - ( ( ( elapsedTime - transitionFadeStartTime ) * 1000 ) / transitionFadeMs ),
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

            mouseInput._camera = this._getActiveCameraFromRefs( this.refs );

        }

    }

    _onRenderUpdate( renderer ) {

        const { gameState, } = this.props;

        if( !gameState.renderer ) {

            gameState.renderer = renderer;

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

    onShowConfirmMenuScreen() {

        this.setState({
            clickable: false,
            paused: true,
            confirmRestart: false,
            confirmMenu: true,
        });

    }

    onExitToMenuDeny() {

        this.setState({
            clickable: false,
            paused: true,
            confirmRestart: false,
            confirmMenu: false,
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

        const { renderer } = this.props.gameState;
        if( renderer ) {
            renderer.clearDepth();
        }

    }

    render() {

        const {
            fps, mouseInput, clickable, paused, confirmRestart, confirmMenu,
        } = this.state;

        const {
            playerScale, playerMass, gameStarted, books, fonts, letters,
            assets,
        } = this.props;

        const { gameRenderer, } = this.refs;

        const { playerMatrix } = Mediator;
        const bubblePosition = isSpeech && gameRenderer && playerMatrix ?
            toScreenPosition(
                gameWidth, gameHeight, playerMatrix, gameRenderer.refs.camera
            ) : null;

        // The mainCamera stuff is confusing. I don't fully understand it. All
        // screens have a *ref* named camera. That's what this points to I
        // suspect. For all of the viewports below, cameraName points to the
        // *name* of the camera. So for all screens there should be a
        // ref="camera" and a cameraName="uniqueCameraName"
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

            { confirmMenu ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="confirmMenuCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { isSpeech ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="speechCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { !confirmRestart && !confirmMenu && paused ? <viewport
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
                    color={ 0x999999 }
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
                        onPause={ this.onPause }
                        onShowConfirmRestartScreen={ this.onShowConfirmRestartScreen }
                        onShowConfirmMenuScreen={ this.onShowConfirmMenuScreen }
                        ref="gameRenderer"
                        fonts={ fonts }
                        assets={ assets }
                        letters={ letters }
                        playerTexture={ playerTexture }
                        playerTextureLegs={ playerTextureLegs }
                        playerTextureTail={ playerTextureTail }
                        mouseInput={ mouseInput }
                    /> : <TitleScreen
                        ref="titleScreen"
                        onClickRegionLeave={ this.onClickRegionLeave }
                        onClickRegionEnter={ this.onClickRegionEnter }
                        mouseInput={ mouseInput }
                        fonts={ fonts }
                        assets={ assets }
                        letters={ letters }
                        onSelect={ this.selectBook }
                        playerTexture={ playerTexture }
                        playerTextureLegs={ playerTextureLegs }
                        playerTextureTail={ playerTextureTail }
                        books={ Object.values( books ) }
                    />
                }

                { gameStarted && isSpeech && <SpeechScreen
                    ref="speechScreen"
                    assets={ assets }
                    fonts={ fonts }
                    time={ this.state.elapsedTime }
                    avatarPosition={ bubblePosition }
                    gameWidth={ gameWidth }
                    gameHeight={ gameHeight }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    playerTextureTail={ playerTextureTail }
                    letters={ letters }
                /> }

                { gameStarted && !confirmRestart && !confirmMenu && paused ? <PausedScreen
                    ref="pausedScreen"
                    mouseInput={ mouseInput }
                    onClickRegionLeave={ this.onClickRegionLeave }
                    onClickRegionEnter={ this.onClickRegionEnter }
                    onUnpause={ this.onUnpause }
                    assets={ assets }
                    onRestart={ this.onShowConfirmRestartScreen }
                    onShowConfirmMenuScreen={ this.onShowConfirmMenuScreen }
                    fonts={ fonts }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    playerTextureTail={ playerTextureTail }
                    letters={ letters }
                /> : null }

                { gameStarted && confirmRestart ? <ConfirmRestartScreen
                    ref="confirmRestartScreen"
                    mouseInput={ mouseInput }
                    onClickRegionLeave={ this.onClickRegionLeave }
                    onClickRegionEnter={ this.onClickRegionEnter }
                    onConfirm={ this.onConfirmRestart }
                    assets={ assets }
                    onDeny={ this.onDenyRestart }
                    fonts={ fonts }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    playerTextureTail={ playerTextureTail }
                    letters={ letters }
                /> : null }

                { gameStarted && confirmMenu ? <ConfirmMenuScreen
                    ref="confirmMenuScreen"
                    mouseInput={ mouseInput }
                    onClickRegionLeave={ this.onClickRegionLeave }
                    onClickRegionEnter={ this.onClickRegionEnter }
                    onConfirm={ this.onExitToMenuConfirm }
                    assets={ assets }
                    onDeny={ this.onExitToMenuDeny }
                    fonts={ fonts }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    playerTextureTail={ playerTextureTail }
                    letters={ letters }
                /> : null }

            <TransitionScreen />

            </scene>

        </React3>;

        return <div>
            <div
                ref="container"
                className={ cx({ clickable, gameContainer: true }) }
                style={{
                    width: gameWidth,
                    height: gameHeight,
                }}
            >
                { isSpeech && bubblePosition ? <SpeechBubble
                    position={ bubblePosition }
                    offset={ bubbleOffset }
                    gameWidth={ gameWidth }
                    gameHeight={ gameHeight }
                    text="Hello! Let's explore."
                /> : null }
                { react3 }
            </div>

            <br />
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
