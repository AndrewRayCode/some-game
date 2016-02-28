import THREE from 'three';
import { loadModel } from '../../containers/Dung/Utils';

const LOAD = 'assets/LOAD';
const LOAD_SUCCESS = 'assets/LOAD_SUCCESS';
const LOAD_FAIL = 'assets/LOAD_FAIL';

const ADD_SHADER = 'assets/ADD_SHADER';

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
            console.error( action );
            return assets;

        default:
            return assets;
            
    }

}

export function shadersReducer( shaders = {}, action = {} ) {

    switch( action.type ) {

        case ADD_SHADER:
            return {
                ...shaders,
                [ action.name ]: {
                    json: action.data,
                    material: action.material
                }
            };

        default:
            return shaders;
            
    }

}

// Actions
export function loadAsset( url, data ) {
    return dispatch =>
        loadModel( url, data )
            .then( result => dispatch({ type: LOAD_SUCCESS, ...result }) )
            .catch( error => dispatch({ type: LOAD_FAIL, error }) );
}

export function loadShader( name, data, material ) {
    return {
        type: ADD_SHADER,
        name, data, material
    };
}
