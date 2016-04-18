import React from 'react';
import THREE from 'three';
import {
    bufferToGeometry, loadModel,
    loadFont as utilLoadFont,
    loaders
} from '../../helpers/Utils';
import shaderFrog from '../../helpers/shaderFrog';
import CustomShaders from '../../helpers/CustomShaders';

const MODEL_LOAD_SUCCESS = 'assets/MODEL_LOAD_SUCCESS';
const MODEL_LOAD_FAIL = 'assets/MODEL_LOAD_FAIL';

const FONT_LOAD_SUCCESS = 'assets/FONT_LOAD_SUCCESS';
const FONT_LOAD_FAIL = 'assets/FONT_LOAD_FAIL';

const ASSETS_LOADING = 'assets/ASSETS_LOADING';
const ASSETS_LOADED = 'assets/ASSETS_LOADED';

const ADD_SHADER = 'assets/ADD_SHADER';

export function letterGeometryReducer( fonts = {}, action = {} ) {

    switch( action.type ) {

        case FONT_LOAD_SUCCESS:
            const fontName = action.payload.font.data.original_font_information.full_font_name;
            const { font } = action.payload;
            const { glyphs } = font.data;

            // Don't re-create fonts on hot reload on client side
            window.fonts = window.fonts || {};
            const letterGeometries = window.fonts[ fontName ] || Object.keys( glyphs ).reduce( ( memo, glyph ) => ({
                ...memo,
                [ glyph ]: <textGeometry
                    key={ glyph }
                    resourceId={ `${ fontName }_${ glyph }` }
                    userData={ glyphs[ glyph ] }
                    size={ 1 }
                    height={ 0.25 }
                    bevelEnabled
                    bevelThickness={ 0.1 }
                    bevelSize={ 0.01 }
                    font={ font }
                    text={ glyph }
                />
            }), {} );

            window.fonts[ fontName ] = letterGeometries;

            return {
                ...fonts,
                [ fontName ]: letterGeometries
            };

        default:
            return fonts;
            
    }

}

export function fontsReducer( fonts = {}, action = {} ) {

    switch( action.type ) {

        case FONT_LOAD_SUCCESS:
            const name = action.payload.font.data.original_font_information.full_font_name;
            const { font } = action.payload;
            return {
                ...fonts,
                [ name ]: font
            };

        case FONT_LOAD_FAIL:
            console.error( action );
            return fonts;

        default:
            return fonts;
            
    }

}

export function loadingAssetsReducer( state = false, action = {} ) {

    switch( action.type ) {

        case ASSETS_LOADING:
            return true;

        default:
            return state;

    }

}

export function loadAssetsReducer( state = false, action = {} ) {

    switch( action.type ) {

        case ASSETS_LOADED:
            return true;

        default:
            return state;

    }

}

export function assetsReducer( assets = {}, action = {} ) {

    switch( action.type ) {

        case MODEL_LOAD_SUCCESS:

            if( assets[ action.name ] ) {
                throw new Error( `Error: An asset named "${ action.name }" has already been loaded.` );
            }

            if( !( action.geometry instanceof THREE.Geometry ) ) {
                console.error( `${ action.name }.geometry not instance of THREE.Geometry. Action:`, action );
                throw new Error( 'Attempted to load model but action.geometry was not an instanceof THREE.Geometry' );
            }

            return {
                ...assets,
                [ action.name ]: {
                    model: action.rawModelData,
                    materials: action.materials,
                    geometry: action.geometry
                }
            };

        case MODEL_LOAD_FAIL:
            console.error( action );
            return assets;

        default:
            return assets;
            
    }

}

export function shadersReducer( shaders = {}, action = {} ) {

    switch( action.type ) {

        case ADD_SHADER:
            const { name, data, material } = action;
            return {
                ...shaders,
                [ name ]: {
                    json: action.data,
                    material,
                    resource: <rawShaderMaterial
                        depthTest={ ( /wrap/i ).test( name ) }
                        transparent
                        key={ name }
                        resourceId={ name }
                        vertexShader={ data.vertex }
                        fragmentShader={ data.fragment }
                        uniforms={ material.uniforms }
                    />
                }
            };

        default:
            return shaders;
            
    }

}

export function loadWithDefaultLoader( name:string, url:string, fetchGeometry:any, loader:any ) {
    return dispatch =>
        loadModel( url, loader )
            .then( result => dispatch({
                type: MODEL_LOAD_SUCCESS,
                name,
                rawModelData: result.model,
                materials: result.materials,
                geometry: fetchGeometry ? fetchGeometry( result.model ) : result.model,
            }) )
            .catch( error => dispatch({ type: MODEL_LOAD_FAIL, error }) );
}

export function loadWithLoader( name:string, url:string, loader:Object, fetchGeometry:any ) {

    return loadWithDefaultLoader( name, url, fetchGeometry, loader );

}

export function loadFont( url ) {
    return dispatch =>
        utilLoadFont( url )
            .then( payload => dispatch({ type: FONT_LOAD_SUCCESS, payload }) )
            .catch( error => dispatch({ type: FONT_LOAD_FAIL, error }) );
}

export function loadShader( name, data, material ) {
    return {
        type: ADD_SHADER,
        name, data, material
    };
}

export function areAssetsLoaded( globalState ) {

    return globalState.assetsLoaded;

}

export function assetsLoading() {
    return {
        type: ASSETS_LOADING
    };
}

export function loadAllAssets() {

    return dispatch => {

        dispatch( assetsLoading() );

        dispatch( loadWithLoader(
            'charisma',
            require( '../../../assets/models/charisma.json' ),
            loaders.js,
            model => {
                model.computeVertexNormals();
                return model;
            }
        ));

        dispatch( loadWithLoader(
            'multiwall',
            require( '../../../assets/models/multiwall.json' ),
            loaders.js
        ));

        dispatch( loadWithDefaultLoader(
            'house',
            require( '../../../assets/models/houseSF.obj' ),
            model => bufferToGeometry( model.children[ 1 ].geometry ),
        ));

        dispatch( loadWithLoader(
            'eye',
            require( '../../../assets/models/eye.json' ),
            loaders.js
        ));

        dispatch( loadWithDefaultLoader(
            'charismaLegs',
            require( '../../../assets/models/charisma-legs.json' ),
            result => result.children[ 0 ].geometry,
        ));

        dispatch( loadWithLoader(
            'tube',
            require( '../../../assets/models/tube.json' ),
            loaders.js
        ));

        dispatch( loadWithLoader(
            'tubeBend',
            require( '../../../assets/models/tube-bend.json' ),
            loaders.js,
        ));

        dispatch( loadFont(
            require( '../../../assets/sniglet_regular.typeface.js' )
        ));

        dispatch( loadWithLoader(
            'diamondBox',
            require( '../../../assets/models/diamond-box.json' ),
            loaders.js,
        ));

        dispatch( loadWithLoader(
            'chamferBox',
            require( '../../../assets/models/chamfer-box.json' ),
            loaders.js,
        ));

        dispatch( loadWithLoader(
            'curvedWall',
            require( '../../../assets/models/curved-wall.json' ),
            loaders.js,
        ));

        dispatch( loadWithLoader(
            'curvedWallTop',
            require( '../../../assets/models/curved-wall-top.json' ),
            loaders.js,
        ));

        Object.keys( CustomShaders ).forEach( key => {

            const json = JSON.parse(
                JSON.stringify( CustomShaders[ key ] )
            );
            shaderFrog.add( key, json );

            dispatch( loadShader(
                key, json, shaderFrog.get( key )
            ));

        });

        dispatch({ type: ASSETS_LOADED });

    };

}
