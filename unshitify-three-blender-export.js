var fs = require('fs');
var path = require('path');

var filename = path.resolve( __dirname, process.argv[ 2 ] );
var contents = require( filename );

// First delete the useless animations key that crashes the object loader
// https://github.com/mrdoob/three.js/issues/8723
delete contents.animations;

contents.geometries = contents.geometries.map(function( geometry ) {
    var morphTargets = geometry.data.morphTargets;

    // Fix morphTargets, which are exported as [ [x,y,z], [x,y,z]... ] but
    // should be [ x,y,z,x,y,z... ]
    // see https://github.com/mrdoob/three.js/issues/7724
    if( morphTargets && morphTargets.length ) {

        geometry.data.morphTargets = morphTargets.map(function( data ) {
            var vertices = [].concat.apply( [], data.vertices.map(function( vertices ) {
                return [ vertices[ 0 ], vertices[ 2 ], -vertices[ 1 ] ];
            }) );
            return {
                name: data.name,
                vertices: vertices
            };
        });

    }

    return geometry;

});

fs.writeFile( filename, JSON.stringify( contents, null, 2 ) );
