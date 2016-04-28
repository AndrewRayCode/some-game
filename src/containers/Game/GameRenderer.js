import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import p2 from 'p2';
import { Player, EntityGroup } from 'components';
import {
    getCameraDistanceToPlayer, lookAtVector, p2ToV3, applyMiddleware,
    p2AngleToEuler,
} from 'helpers/Utils';
import {
    gameKeyPressReducer, tourReducer, zoomReducer, entityInteractionReducer,
    playerScaleReducer, debugReducer, advanceLevelReducer,
    defaultCameraReducer, playerAnimationReducer, speechReducer,
    physicsReducer,
} from 'game-middleware';

import {
    setUpPhysics, setUpWorld, emptyWorld, tearDownWorld,
    scalePlayer as scalePlayerAndDispatch,
} from 'physics-utils';

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;

export default class GameRenderer extends Component {

    static propTypes = {
        onPause: PropTypes.func.isRequired,
        onShowConfirmRestartScreen: PropTypes.func.isRequired,
        onShowConfirmMenuScreen: PropTypes.func.isRequired,
        fonts: PropTypes.object.isRequired,
        letters: PropTypes.object.isRequired,
    }

    constructor( props, context ) {

        super( props, context );
        
        const {
            playerPosition, playerScale, playerRadius, onPause, advanceChapter,
            onShowConfirmMenuScreen, onShowConfirmRestartScreen, gameState,
            scalePlayer,
        } = props;

        this.state = { touring: false, };

        this._onUpdate = this._onUpdate.bind( this, gameState );
        this._getMeshStates = this._getMeshStates.bind( this );
        this._getPlankStates = this._getPlankStates.bind( this );
        this._getAnchorStates = this._getAnchorStates.bind( this );

        // Things to pass to reducers so they can call them
        gameState.reducerActions = {
            reduxScalePlayer: scalePlayer,
            scalePlayerAndDispatch,
            onPause, advanceChapter, onShowConfirmMenuScreen,
            onShowConfirmRestartScreen
        };

    }

    componentDidMount() {

        const { gameState, } = this.props;
        setUpWorld( gameState );

        setUpPhysics( gameState, this.props );

    }

    componentWillUnmount() {

        tearDownWorld( this.props.gameState );

    }

    // Don't forget to pass down any of these props from GameGUI!
    componentWillReceiveProps( nextProps ) {

        const { gameState, } = nextProps;
        const { world, } = gameState;

        if( nextProps.recursionBusterId !== this.props.recursionBusterId ) {

            this.transitionFromLastChapterToNextChapter( nextProps );

        } else if( nextProps.restartBusterId !== this.props.restartBusterId ) {

            emptyWorld( world );
            setUpPhysics( gameState, nextProps );

            const { playerScale, playerPosition } = nextProps;

            // TODO: Resetting here should be done in a reducer
            gameState.cameraPosition = THREE.Vector3(
                playerPosition.x,
                getCameraDistanceToPlayer( playerPosition.y, cameraFov, playerScale ),
                playerPosition.z
            );

        }

        //if( this.state.touring ) {
            //this.setState({
                //cameraPosition: new THREE.Vector3(
                    //( cameraPosition.x - chapterPosition.x ) * multiplier,
                    //( cameraPosition.y ) * multiplier,
                    //( cameraPosition.z - chapterPosition.z ) * multiplier
                //),
                //cameraTourTarget: new THREE.Vector3(
                    //( cameraTourTarget.x - chapterPosition.x ) * multiplier,
                    //( cameraTourTarget.y ) * multiplier,
                    //( cameraTourTarget.z - chapterPosition.z ) * multiplier
                //),
            //});
        //}

    }

    transitionFromLastChapterToNextChapter( nextProps ) {

        const { gameState, } = this.props;
        const {
            cameraPosition, currentTransitionPosition
        } = gameState;

        const { previousChapterNextChapter } = nextProps;
        const {
            position: chapterPosition,
            scale,
        } = previousChapterNextChapter;

        const multiplier = scale.x < 1 ? 8 : 0.125;

        // TODO: Same here
        gameState.cameraPosition = new THREE.Vector3(
            ( cameraPosition.x - chapterPosition.x ) * multiplier,
            getCameraDistanceToPlayer( 1 + nextProps.playerRadius, cameraFov, nextProps.playerScale ),
            ( cameraPosition.z - chapterPosition.z ) * multiplier
        );
        gameState.currentTransitionPosition = null;
        gameState.currentTransitionTarget = null;

        emptyWorld( gameState.world );

        const newPosition2D = [
            ( currentTransitionPosition.x - chapterPosition.x ) * multiplier,
            ( currentTransitionPosition.z - chapterPosition.z ) * multiplier,
        ];

        setUpPhysics( nextProps, newPosition2D );

    }

    _getMeshStates( bodies ) {

        const { allEntities } = this.props;

        return bodies.map( physicsBody => {
            const { position, scale, entityId } = physicsBody;
            const entity = allEntities[ physicsBody.entityId ];
            return {
                ...entity,
                scale: new THREE.Vector3().copy( scale ),
                position: p2ToV3( position, physicsBody.depth ),
                entityId
            };
        });

    }

    _getPlankStates( plankData ) {

        const { allEntities } = this.props;

        return plankData.reduce( ( memo, plankBody ) => {

            const { position, angle, entityId } = plankBody;
            const entity = allEntities[ plankBody.entityId ];

            const planks = memo[ entityId ] = memo[ entityId ] || [];

            return {
                ...memo,
                [ entityId ]: [
                    ...planks, {
                        position: p2ToV3( position, plankBody.depth )
                            .sub( entity.position ),
                        rotation: p2AngleToEuler( angle )
                    }
                ]
            };

        }, {} );

    }
    
    _getAnchorStates( plankConstraints ) {

        const { allEntities } = this.props;

        return plankConstraints.reduce( ( memo, constraint ) => {

            const { entityId } = constraint;
            const entity = allEntities[ constraint.entityId ];

            const planks = memo[ entityId ] = memo[ entityId ] || [];

            const worldPositionA = [];
            constraint.bodyA.toWorldFrame( worldPositionA, constraint.localAnchorA );

            const worldPositionB = [];
            constraint.bodyB.toWorldFrame( worldPositionB, constraint.localAnchorB );

            return {
                ...memo,
                [ entityId ]: [
                    ...planks, {
                        positionA: p2ToV3( worldPositionA, constraint.depth )
                            .sub( entity.position ),
                        positionB: p2ToV3( worldPositionB, constraint.depth )
                            .sub( entity.position ),
                    }
                ]
            };

        }, {} );

    }

    _onUpdate( gameState, elapsedTime, delta, keysDown ) {

        const { world, playerBody } = gameState;

        if( !world ) {
            return;
        }

        const { playerRadius, paused } = this.props;
        const { currentFlowPosition, } = this.state;

        const playerPosition = currentFlowPosition ||
            p2ToV3( playerBody.position, 1 + playerRadius );

        // In any state, (paused, etc), child components need the updaed time
        const baseState = {
            cameraFov,
            playerPositionV3: playerPosition,
            time: elapsedTime,
            delta,
        };

        if( paused ) {
            this.setState( baseState );
            return;
        }

        // Apply the middleware. Will reduce gameState in place :(
        applyMiddleware(
            keysDown, gameState.reducerActions, this.props, gameState, baseState,
            physicsReducer, gameKeyPressReducer, tourReducer,
            advanceLevelReducer, zoomReducer, debugReducer,
            entityInteractionReducer, playerScaleReducer, defaultCameraReducer,
            playerAnimationReducer, speechReducer,
        );

        // Maybe worth moving into reducers?
        this.setState({
            movableEntities: this._getMeshStates( gameState.physicsBodies ),
            plankEntities: this._getPlankStates( gameState.plankData ),
            anchorEntities: this._getAnchorStates( gameState.plankConstraints ),
        });

    }

    render() {

        const { gameState, } = this.props;
        const { world, playerContact, playerBody, } = gameState;

        if( !world ) {

            return <object3D />;

        }

        const {
            time, cameraPosition, cameraPositionZoomOut, cameraPositionZoomIn,
            currentFlowPosition, debug, touring, cameraTourTarget, entrance1,
            entrance2, tubeFlow, tubeIndex, currentTransitionPosition,
            currentTransitionTarget, scalingOffsetZ, adjustedPlayerScale,
            playerRotation, playerScaleEffectsEnabled,
            playerScaleEffectsVisible, rightEyeRotation, leftEyeRotation,
            rightLidRotation, leftLidRotation, headAnimations, legAnimations,
            tailAnimations, eyeMorphTargets, tailRotation, tailPosition,
        } = gameState;

        const {
            movableEntities, plankEntities, anchorEntities,
        } = ( this.state.debuggingReplay ? this.state.debuggingReplay[ this.state.debuggingIndex ] : this.state );

        const {
            playerRadius, playerScale, nextChapters, nextChaptersEntities,
            previousChapterEntities, previousChapterEntity,
            currentLevelRenderableEntitiesArray, previousChapterFinishEntity,
            assets, shaders, paused, playerMaterialId, playerTexture,
            playerTextureLegs, playerTextureTail,
        } = this.props;

        const playerPosition = new THREE.Vector3()
            .copy(
                currentTransitionPosition || currentFlowPosition || p2ToV3(
                    playerBody.position, 1 + playerRadius,
                )
            ).sub({ x: 0, y: 0, z: scalingOffsetZ || 0 });

        const lookAt = lookAtVector(
            cameraPosition,
            touring ? cameraTourTarget : playerPosition
        );

        return <object3D
            onUpdate={ this._onUpdate }
        >

            <perspectiveCamera
                name="mainCamera"
                ref="camera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPositionZoomIn || cameraPositionZoomOut || cameraPosition }
                quaternion={ lookAt }
            />

            <Player
                ref="player"
                assets={ assets }
                scaleEffectsEnabled={ playerScaleEffectsEnabled }
                scaleEffectsVisible={ playerScaleEffectsVisible }
                position={ playerPosition }
                radius={ playerRadius }
                scale={ adjustedPlayerScale }
                rotation={ playerRotation }
                materialId={ playerMaterialId }
                playerTexture={ playerTexture }
                playerTextureLegs={ playerTextureLegs }
                playerTextureTail={ playerTextureTail }
                leftLidRotation={ leftLidRotation }
                rightLidRotation={ rightLidRotation }
                leftEyeRotation={ leftEyeRotation }
                rightEyeRotation={ rightEyeRotation }
                eyeMorphTargets={ eyeMorphTargets }
                headAnimations={ headAnimations }
                legAnimations={ legAnimations }
                tailAnimations={ tailAnimations }
                tailRotation={ tailRotation }
                tailPosition={ tailPosition }
                time={ time }
            />

            <EntityGroup
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                ref="staticEntities"
                playerRadius={ playerRadius }
                entities={ movableEntities }
                time={ time }
            />

            <EntityGroup
                paused={ paused }
                playerBody={ this.playerBody }
                world={ this.world }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                ref="staticEntities"
                playerRadius={ playerRadius }
                entities={ currentLevelRenderableEntitiesArray }
                plankEntities={ plankEntities }
                anchorEntities={ anchorEntities }
                time={ time }
            />

            { nextChapters.map( nextChapter => <EntityGroup
                paused={ paused }
                key={ nextChapter.id }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                position={ nextChapter.position }
                scale={ nextChapter.scale }
                playerRadius={ playerRadius }
                entities={ nextChaptersEntities[ nextChapter.chapterId ] }
                time={ time }
            /> )}

            { previousChapterEntity && <EntityGroup
                paused={ paused }
                assets={ assets }
                shaders={ shaders }
                debug={ debug }
                position={ previousChapterEntity.position }
                scale={ previousChapterEntity.scale }
                entities={ previousChapterEntities }
                playerRadius={ playerRadius }
                time={ time }
                opacity={ 0.5 }
            /> }

            { debug && previousChapterFinishEntity && <mesh
                position={ previousChapterFinishEntity.position }
                scale={ previousChapterFinishEntity.scale.clone().multiply( new THREE.Vector3( 1, 2, 1 ) ) }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="middleMaterial"
                />
            </mesh> }

            { debug && currentTransitionTarget && <mesh
                position={ currentTransitionTarget }
                scale={ new THREE.Vector3( 0.2, 2, 0.2 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }

            { debug && tubeFlow && tubeFlow[ tubeIndex ].middle && <mesh
                position={ tubeFlow[ tubeIndex ].middle }
                scale={ new THREE.Vector3( 0.25, 2, 0.25 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="middleMaterial"
                />
            </mesh> }
            { debug && tubeFlow && <mesh
                position={ ( tubeIndex === tubeFlow.length - 1 ?
                    tubeFlow[ tubeIndex ].exit :
                    tubeFlow[ tubeIndex ].end
                ) }
                scale={ new THREE.Vector3( 0.15, 2, 0.15 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && tubeFlow && <mesh
                position={ tubeFlow[ tubeIndex ].start }
                scale={ new THREE.Vector3( 0.15, 2, 0.15 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="entranceMaterial"
                />
            </mesh> }

            { debug && entrance1 && <mesh
                position={ entrance1 }
                scale={ new THREE.Vector3( 0.5, 2, 0.5 ).multiplyScalar( playerScale )}
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="greenDebugMaterial"
                />
            </mesh> }
            { debug && entrance2 && <mesh
                position={ entrance2 }
                scale={ new THREE.Vector3( 0.5, 2, 0.5 ).multiplyScalar( playerScale )}
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && this.state.playerSnapped && <mesh
                position={this.state.playerSnapped }
                scale={ new THREE.Vector3( 0.1, 3.5, 0.1 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="exitMaterial"
                />
            </mesh> }
            { debug && this.state.playerTowardTube && <mesh
                position={this.state.playerTowardTube }
                scale={ new THREE.Vector3( 0.1, 3.5, 0.1 ).multiplyScalar( playerScale ) }
            >
                <geometryResource
                    resourceId="playerGeometry"
                />
                <materialResource
                    resourceId="greenDebugMaterial"
                />
            </mesh> }

            { debug && Object.keys( playerContact || {} ).map( key => {

                return <mesh
                    position={ playerPosition.clone().add( playerContact[ key ].clone().multiplyScalar( playerScale ) ) }
                    scale={ new THREE.Vector3( 0.1, 3, 0.15 ).multiplyScalar( playerScale ) }
                    key={ key }
                >
                    <geometryResource
                        resourceId="playerGeometry"
                    />
                    <materialResource
                        resourceId="blueDebugMaterial"
                    />
                </mesh>;

            }) }

            { debug && this.world.narrowphase.contactEquations.map( ( contact, index ) => {
                const { contactPointA, bodyA } = contact;
                return <mesh
                    scale={ new THREE.Vector3( playerScale * 0.1, playerScale * 3, playerScale * 0.1 ) }
                    key={ `contact_${ index }_a` }
                    position={ p2ToV3( p2.vec2.add( [ 0, 0 ], contactPointA, bodyA.position ), 1 ) }
                >
                    <geometryResource
                        resourceId="radius1sphere"
                    />
                    <materialResource
                        resourceId="greenDebugMaterial"
                    />
                </mesh>;
            }) }

        </object3D>;

    }

}
