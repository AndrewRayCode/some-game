import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import CANNON from 'cannon/src/Cannon';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { bindActionCreators } from 'redux';
import {
    areBooksLoaded, loadAllBooks, deserializeLevels
} from '../../redux/modules/editor';
import { areAssetsLoaded, loadAllAssets } from '../../redux/modules/assets';
import {
    scalePlayer, advanceChapter, startGame
} from '../../redux/modules/game';
import KeyCodes from '../../helpers/KeyCodes';

import { getSphereMass } from '../../helpers/Utils';

import GameRenderer from './GameRenderer';
import { TitleScreen } from '../../components';

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
            assets, shaders, fonts
        } = state;

        // No game has been started yet!
        if( !gameChapterData.currentChapterId ) {

            return {
                books: state.books,
                chapters: state.chapters,
                levels: state.levels,
                entities: state.entities,
                fonts,
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
            nextChaptersEntities, assets, shaders, fonts,
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
        startGame
    }, dispatch )
)
export default class GameGUI extends Component {

    static contextTypes = {
        store: PropTypes.object.isRequired
    }

    constructor( props, context ) {

        super( props, context );
        this.state = {};
        this.selectBook = this.selectBook.bind( this );

    }

    selectBook( book ) {

        const { levels, entities, books, chapters } = this.props;
        this.props.startGame(
            book.id, book.chapterIds[ 0 ], levels, entities, books, chapters
        );

    }

    render() {

        const { fps } = this.state;

        const {
            playerScale, playerMass, gameStarted, isClient, books, fonts
        } = this.props;

        return <div>
            { isClient ?
                ( gameStarted ?
                    <GameRenderer { ...this.props } /> :
                    <TitleScreen
                        fonts={ fonts }
                        onSelect={ this.selectBook }
                        books={ Object.values( books ) }
                    />
                ) :
                <div>Loading&hellip;</div>
            }
            <br />
            FPS: { fps }
            <br />
            Player Scale: <input readOnly value={ playerScale } type="text" />
            <br />
            Player Mass: <input readOnly value={ playerMass } type="text" />
        </div>;

    }

}
