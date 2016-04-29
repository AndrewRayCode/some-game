import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import p2 from 'p2';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import KeyHandler from 'helpers/KeyHandler';

import { loadAllAssets, } from 'redux/modules/assets';
import {
    scalePlayer, advanceChapter, startGame, stopGame, restartChapter,
    queueBeginContactEvent, queueEndContactEvent,
} from 'redux/modules/game';
import {
    areBooksLoaded, loadAllBooks, deserializeLevels
} from 'redux/modules/editor';

import { getSphereMass, applyMiddleware, } from 'helpers/Utils';

import { updateGameState, } from 'redux/modules/game';

import {
    pauseGame, unpauseGame, showConfirmMenuScreen, exitToMenuDeny,
    showConfirmRestartScreen, exitToMenuConfirm, confirmRestart, denyRestart,
} from 'redux/modules/gameScreen';

import {
    playerPositionReducer, gameKeyPressReducer, tourReducer, zoomReducer,
    entityInteractionReducer, playerScaleReducer, debugReducer,
    advanceLevelReducer, defaultCameraReducer, playerAnimationReducer,
    speechReducer, contactEventReducer, physicsReducer,
} from 'game-middleware';

import GameGUI from './GameGUI';

// State selectors for createSelector memoization
const getAllEntities = state => state.game.entities;
const getAllChapters = state => state.chapters;
const getLevels = state => state.game.levels;
const getGameStarted = state => state.game.started;
const getBooks = state => state.books;
const getActiveChapters = state => state.game.chapters;
const getPlayerMaterialId = state => state.game.playerMaterialId;
const getGameChapterData = state => state.gameChapterData;
const getOriginalLevels = state => state.levels;
const getOriginalEntities = state => state.entities;
const getAssets = state => state.assets;
const getFonts = state => state.fonts;
const getLetters = state => state.letters;
const getRestartBusterId = state => state.game.restartBusterId;
const getRecursionBusterId = state => state.game.recursionBusterId;
const getPlayerPosition = state => state.game.playerPosition;
const getPlayerRadius = state => state.game.playerRadius;
const getPlayerScale = state => state.game.playerScale;
const getPlayerDensity = state => state.game.playerDensity;
const getPushyDensity = state => state.game.pushyDensity;

const gameDataSelector = createSelector(
    [
        getGameStarted, getAllEntities, getAllChapters, getLevels, getBooks,
        getActiveChapters, getPlayerMaterialId, getGameChapterData,
        getOriginalLevels, getOriginalEntities, getAssets, getFonts,
        getLetters, getRestartBusterId, getRecursionBusterId,
        getPlayerPosition, getPlayerRadius, getPlayerScale, getPlayerDensity,
        getPushyDensity,
    ],
    (
        gameStarted, allEntities, allChapters, levels, books, activeChapters,
        playerMaterialId, gameChapterData, originalLevels, originalEntities,
        assets, fonts, letters, restartBusterId, recursionBusterId,
        playerPosition, playerRadius, playerScale, playerDensity, pushyDensity,
    ) => {

        // No game has been started yet!
        if( !gameChapterData.currentChapterId ) {

            return {
                chapters: allChapters,
                books, originalLevels, originalEntities, fonts,
                letters, assets,
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
            levels, currentLevel, currentLevelId, currentChapterId,
            currentLevelAllEntities, currentLevelStaticEntities, allEntities,
            nextChaptersEntities, assets, fonts, letters, originalLevels,
            originalEntities, books, gameStarted,
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
            chapters: activeChapters,
            restartBusterId: restartBusterId,
            recursionBusterId: recursionBusterId,
            playerPosition: playerPosition,
            playerRadius: playerRadius,
            playerScale: playerScale,
            playerDensity: playerDensity,
            pushyDensity: pushyDensity,
            playerMass: getSphereMass( playerDensity, playerRadius )
        };

    }
);

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
        gameState: state.game.gameState,
        cameraFov: state.game.cameraFov,
        ...gameDataSelector( state ),
    }),
    dispatch => bindActionCreators({
        loadAllAssets, deserializeLevels, scalePlayer, advanceChapter,
        startGame, stopGame, restartChapter, pauseGame, unpauseGame,
        showConfirmMenuScreen, exitToMenuDeny, showConfirmRestartScreen,
        exitToMenuConfirm, confirmRestart, denyRestart, updateGameState,
        queueBeginContactEvent, queueEndContactEvent,
    }, dispatch )
)
export default class GameContainer extends Component {

    static contextTypes = {
        store: PropTypes.object.isRequired
    }

    constructor() {

        super();
        this.gameLoop = this.gameLoop.bind( this );

    }

    componentDidMount() {

        this.mounted = true;

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

        this.lastTime = 0;

        this.reqAnimId = window.requestAnimationFrame( this.gameLoop );

    }

    componentWillUnmount() {

        this.mounted = false;
        window.cancelAnimationFrame( this.reqAnimId );

    }

    gameLoop( time ) {

        if( !this.mounted ) {
            return;
        }

        this.reqAnimId = window.requestAnimationFrame( this.gameLoop );

        const {
            updateGameState: updateState, gameState, gameStarted,
        } = this.props;

        if( !gameStarted ) {
            return;
        }

        const delta = time - this.lastTime;
        this.lastTime = time;

        // In any state, (paused, etc), child components need the updaed time
        const currentState = { time, delta, };

        // Apply the middleware
        updateState(
            applyMiddleware(
                // Note: KeyHandler is updated in UpdateAllObjects for now
                // props twice for "actions" and "gameData". Refacotr later.
                KeyHandler, this.props, this.props, gameState, currentState,
                playerPositionReducer, contactEventReducer, physicsReducer,
                gameKeyPressReducer, tourReducer, advanceLevelReducer,
                zoomReducer, debugReducer, entityInteractionReducer,
                playerScaleReducer, defaultCameraReducer,
                playerAnimationReducer, speechReducer,
            )
        );

    }

    render() {

        const { fonts, assets, books, } = this.props;

        if( !__CLIENT__ ||
                !books ||
                !( 'Sniglet Regular' in fonts ) ||
                !( 'charisma' in assets ) ||
                !( 'charismaLegs' in assets ) ||
                !( 'charismaTail' in assets ) ||
                !( 'eye' in assets ) ||
                !( 'eyeLid' in assets )
            ) {
            return <div>Loading&hellip;</div>;
        }

        return <GameGUI
            { ...this.props }
            store={ this.context.store }
        />;

    }

}
