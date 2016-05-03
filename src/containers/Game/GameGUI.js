import React, { Component } from 'react';

import React3 from 'react-three-renderer';
import THREE from 'three';

import { toScreenPosition, } from 'helpers/Utils';

import { GameRenderer, } from 'containers';
import {
    TitleScreen, GameResources, PausedScreen, ConfirmRestartScreen,
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

const gameWidth = 400;
const gameHeight = 400;
const transitionFadeMs = 1000;
const transitionMaxOpacity = 0.6;
const bubbleOffset = 40;

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
        
        const { gameStarted, paused, } = this.props;

        // This is dumb
        if( window.location.href.indexOf( '3000' ) === -1 &&
                gameStarted && !paused
            ) {

            this.onPause();

        }

    }

    
    onExitToMenuConfirm() {

        this.setState({
            clickable: false,
        });
        const { gameState, } = this.props;
        this.props.stopGame( gameState.world );

    }

    onConfirmRestart() {

        this.setState({
            clickable: false,
        });

        const {
            currentChapterId, originalEntities, originalLevels, chapters,
            books, gameState, currentBookId,
        } = this.props;

        const { world, } = gameState;

        this.props.restartChapter(
            this.props, currentBookId, currentChapterId, originalEntities, originalLevels,
            chapters, books, world
        );

    }

    onDenyRestart() {

        this.setState({
            clickable: false,
        });
        this.props.denyRestart();

    }

    onPause() {

        this.setState({
            clickable: false,
        });
        this.props.pauseGame();

    }

    onUnpause() {

        this.setState({
            clickable: false,
        });
        this.props.unpauseGame();

    }

    // todo get these workin
    onShowConfirmMenuScreen() {

        this.setState({
            clickable: false,
        });
        this.props.showConfirmMenuScreen();

    }

    onExitToMenuDeny() {

        this.setState({
            clickable: false,
        });
        this.props.exitToMenuDeny();

    }

    onShowConfirmRestartScreen() {

        this.setState({
            clickable: false,
        });
        this.props.showConfirmRestartScreen();

    }

    selectBook( book ) {

        this.setState({
            clickable: false,
        });
        const {
            originalLevels, originalEntities, books, chapters,
            playerRadius, playerDensity, pushyDensity,
            currentLevelStaticEntitiesArray, currentLevelMovableEntitiesArray,
            currentLevelBridgesArray,
        } = this.props;

        this.props.startGame(
            this.props, book.id, book.chapterIds[ 0 ], originalLevels,
            originalEntities, books, chapters, playerRadius, playerDensity,
            pushyDensity, currentLevelStaticEntitiesArray,
            currentLevelMovableEntitiesArray, currentLevelBridgesArray,
        );

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

        if( speechScreen ) {
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

        const { _fps, transitionFadeStartTime, } = this.state;
        const newState = { elapsedTime, delta };

        if( transitionFadeStartTime ) {

            newState.transitionFadeAlpha = Math.max(
                transitionMaxOpacity - ( ( ( elapsedTime - transitionFadeStartTime ) * 1000 ) / transitionFadeMs ),
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

        if( !this.renderer ) {

            this.renderer = renderer;

        }

    }

    onClickRegionLeave() {

        this.setState({ clickable: false });

    }

    onClickRegionEnter() {

        this.setState({ clickable: true });

    }

    onBeforeRender() {

        const { renderer, } = this;

        if( renderer ) {
            renderer.clearDepth();
        }

    }

    render() {

        const {
            fps, mouseInput, clickable,
        } = this.state;

        const {
            playerScale, playerMass, gameStarted, books, fonts, letters,
            assets, gameState, paused, confirmingRestart, confirmingMenu,
        } = this.props;

        // Game might not be started yet?
        const {
            textIsVisible, visibleText, textOpenPercent, textIsClosing,
            currentTextPercent, debug,
        } = gameState || {};

        const { gameRenderer, } = this.refs;

        const { playerMatrix } = Mediator;
        const bubblePosition = gameRenderer && gameRenderer.refs.camera && playerMatrix ?
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

            { confirmingRestart ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="confirmRestartCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { confirmingMenu ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="confirmMenuCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { !paused && textIsVisible ? <viewport
                x={ 0 }
                y={ 0 }
                width={ gameWidth }
                height={ gameHeight }
                cameraName="speechCamera"
                onBeforeRender={ this.onBeforeRender }
            /> : null }

            { !confirmingRestart && !confirmingMenu && paused ? <viewport
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

                { gameStarted && !paused && textIsVisible && <SpeechScreen
                    ref="speechScreen"
                    assets={ assets }
                    fonts={ fonts }
                    currentTextPercent={ currentTextPercent }
                    time={ this.state.elapsedTime }
                    isClosing={ textIsClosing }
                    openPercent={ textOpenPercent }
                    avatarPosition={ bubblePosition }
                    gameWidth={ gameWidth }
                    gameHeight={ gameHeight }
                    playerTexture={ playerTexture }
                    playerTextureLegs={ playerTextureLegs }
                    playerTextureTail={ playerTextureTail }
                    letters={ letters }
                /> }

                { gameStarted && !confirmingRestart && !confirmingMenu && paused ? <PausedScreen
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

                { gameStarted && confirmingRestart ? <ConfirmRestartScreen
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

                { gameStarted && confirmingMenu ? <ConfirmMenuScreen
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
                { !paused && textIsVisible && bubblePosition ? <SpeechBubble
                    isClosing={ textIsClosing }
                    openPercent={ textOpenPercent }
                    position={ bubblePosition }
                    offset={ bubbleOffset }
                    gameWidth={ gameWidth }
                    gameHeight={ gameHeight }
                    text={ visibleText }
                /> : null }
                { react3 }
                { debug ? <div className={ styles.debug }>
                    FPS: { fps }
                </div> : null }
            </div>
        </div>;

    }

}
