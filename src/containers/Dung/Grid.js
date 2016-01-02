import 'babel/polyfill';
import React, { Component } from 'react';
import THREE from 'three';
import React3 from 'react-three-renderer';
import PureRenderMixin from 'react/lib/ReactComponentWithPureRenderMixin';

export default class Grid extends Component {

    constructor( props, context ) {

        super( props, context );

    }

    shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate;

    render() {

        const { rows, columns, spacing, position } = this.props;
        const width = rows * spacing;
        const height = columns * spacing;

        const rowLines = [];
        for( let i = 0; i < rows; i++ ) {

            rowLines.push(<line
                key={ `r${ i }` }
                position={ new THREE.Vector3(
                    0, 0, ( i * spacing ) - ( height / 2 )
                ).add( position.clone() ) }
            >
                <shapeGeometryResource
                    resourceId="row"
                    type="points"
                />
                <lineBasicMaterial
                    resourceId="gridLineMaterial"
                />
            </line>);

        }

        const colLines = [];
        for( let i = 0; i < rows; i++ ) {

            colLines.push(<line
                key={ `c${ i }` }
                position={ new THREE.Vector3(
                    ( i * spacing ) - ( width / 2 ), 0, 0
                ).add( position.clone() ) }
                rotation={new THREE.Euler( Math.PI / 2, 0, 0 )}
            >
                <shapeGeometryResource
                    resourceId="col"
                    type="points"
                />
                <lineBasicMaterial
                    resourceId="gridLineMaterial"
                />
            </line>);

        }

        return <group>
            { rowLines }
            { colLines }
        </group>;

    }

}
