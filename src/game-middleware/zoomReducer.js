import zoomIn from './zoomIn';
import zoomOut from './zoomOut';

// The downside of this function is it has to know how each child reducer
// works, because it needs to check if one is already running. The upside,
// go 2 hell forest
export default function zoomReducer(
    keysDown:Object,
    actions:Object,
    props:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    // Is the zoomIn reducer already running?
    if( oldState.cameraPositionZoomIn ) {

        return next( zoomIn( keysDown, actions, props, oldState, currentState, ) );

    // Is the zoom out reducer already running?
    } else if( oldState.cameraPositionZoomOut ) {

        return next( zoomOut( keysDown, actions, props, oldState, currentState, ) );

    }

    const zoomInState = zoomIn( keysDown, actions, props, oldState, currentState, );

    // Did the zoom in reducer modify the state? It takes priority
    if( zoomInState !== currentState ) {

        return next( zoomInState );

    // Otherwise fall back to zoomOut
    } else {

        return next( zoomOut( keysDown, actions, props, oldState, currentState, ) );
    
    }

}
