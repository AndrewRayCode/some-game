import { Vector3, } from 'three';
import p2 from 'p2';
import {
    without, getCardinalityOfVector,
} from 'helpers/Utils';

export default function transitionReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        beginContactEventQueue, endContactEventQueue, playerBody, world,
        playerContact: oldPlayerContact,
    } = oldState;

    const { world, } = gameData;

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

    return next({
        ...currentState,
        playerContact,
        // flush the queues
        beginContactEventQueue: [],
        endContactEventQueue: [],
    });

}
