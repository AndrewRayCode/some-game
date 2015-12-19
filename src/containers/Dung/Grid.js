import 'babel/polyfill';
import React, { Component } from 'react';
import THREE from 'three.js';
import React3 from 'react-three-renderer';
import PureRenderMixin from 'react/lib/ReactComponentWithPureRenderMixin';

export default class Grid extends Component {

    constructor(props, context) {

        super(props, context);

    }

    shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate;

    render() {

        const { rows, columns, spacing } = this.props;
        const width = rows * spacing;
        const height = columns * spacing;

        const rowLines = [];
        for( let i = 0; i < rows; i++ ) {

            rowLines.push(<line
                key={ i }
                position={ new THREE.Vector3(
                    0, 0, ( i * spacing ) - ( height / 2 )
                )}
            >
                <shapeGeometryResource
                    resourceId="row"
                    type="points"
                />
                <lineBasicMaterial
                    resourceId={ !i || !(i % 3) ? 'gridLineMaterialLight' : 'gridLineMaterialDark' }
                />
            </line>);

        }

        const colLines = [];
        for( let i = 0; i < rows; i++ ) {

            colLines.push(<line
                key={ i }
                position={ new THREE.Vector3(
                    ( i * spacing ) - ( width / 2 ), 0, 0
                )}
                rotation={new THREE.Euler( Math.PI / 2, 0, 0 )}
            >
                <shapeGeometryResource
                    resourceId="col"
                    type="points"
                />
                <lineBasicMaterial
                    resourceId={ !i || !(i % 3) ? 'gridLineMaterialLight' : 'gridLineMaterialDark' }
                />
            </line>);

        }

        return <group>
            <resources>
                <shape resourceId="row">
                    <moveTo
                        x={-width / 2}
                        y={0}
                    />
                    <lineTo
                        x={width / 2}
                        y={0}
                    />
                </shape>
                <shape resourceId="col">
                    <moveTo
                        x={0}
                        y={-height / 2}
                    />
                    <lineTo
                        x={0}
                        y={height / 2}
                    />
                </shape>
                <lineBasicMaterial
                    resourceId="gridLineMaterialDark"
                    color={0x222222}
                    linewidth={0.5}
                />
                <lineBasicMaterial
                    resourceId="gridLineMaterialLight"
                    color={0xff0000}
                    linewidth={1.5}
                />
            </resources>
            { rowLines }
            { colLines }
        </group>;

    }

}
