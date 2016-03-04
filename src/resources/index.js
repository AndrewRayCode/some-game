import React from 'react';

import commonResources from './commonResources';
import PausedScreenResources from './PausedScreenResources';

// Turn our resources [ <resource id="a" /> ] into export { a: "a" } so
// consumers of resources can do import { a } from './resources'
function reduceToKeys( ...arrays ) {
    return arrays.reduce( ( memo, array ) => ({
        ...memo,
        ...array.reduce( ( keys, resource ) => {
            return {
                ...keys,
                [ resource.props.resourceId ]: resource.props.resourceId
            };
        }, {} )
    }), {});
}

// Merge all resource arrays together into one big array, giving each component
// a key so it can be placed directly inside a <resources> tag
function mergeAllResources( ...arrays ) {
    let counter = 0;
    return arrays.reduce( ( memo, array ) => [
        ...memo,
        ...array.map( resource =>
            React.cloneElement( resource, { key: counter++ } )
        )
    ], [] );
}

export const resourceIds = reduceToKeys( commonResources, PausedScreenResources );
export const allResources = mergeAllResources( commonResources, PausedScreenResources );
