import THREE from 'three';
import { loadModel } from '../../containers/Dung/Utils';

const LOAD = 'assets/LOAD';
const LOAD_SUCCESS = 'assets/LOAD_SUCCESS';
const LOAD_FAIL = 'assets/LOAD_FAIL';

export function assetsReducer( assets = {}, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...assets,
                [ action.name ]: {
                    ...action.model,
                    geometry: action.model.children.map( child =>
                        new THREE.Geometry().fromBufferGeometry( child.geometry )
                    )
                }
            };

        case LOAD_FAIL:
            throw new Error( action );

        default:
            return assets;
            
    }

}

// Actions
export function loadAsset( url, data ) {
    return dispatch =>
        loadModel( url, data )
            .then( result => dispatch({ type: LOAD_SUCCESS, ...result }) )
            .catch( result => dispatch({ type: LOAD_FAIL, ...result }) );
}