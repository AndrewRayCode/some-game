import React, { Component } from 'react';
import THREE from 'three.js';
import TubeBend from './TubeBend';
import TubeStraight from './TubeStraight';

export default class StaticEntities extends Component {

    constructor(props, context) {
        super(props, context);
    }

    render() {

        const { entities } = this.props;

        return <group>
            <resources>
                <boxGeometry
                    resourceId="wallGeometry"
                    width={1}
                    height={1}
                    depth={1}
                    widthSegments={1}
                    heightSegments={1}
                />
                <meshPhongMaterial
                    resourceId="ornateWall"
                    color={ 0xffffff }
                >
                    <texture
                        url={ require( './brick-pattern-ornate.png' ) }
                        wrapS={ THREE.RepeatWrapping }
                        wrapT={ THREE.RepeatWrapping }
                        anisotropy={16}
                    />
                </meshPhongMaterial>

                <shape resourceId="tubeWall">
                    <absArc
                        x={0}
                        y={0}
                        radius={0.5}
                        startAngle={0}
                        endAngle={Math.PI * 2}
                        clockwise={false}
                    />
                    <hole>
                        <absArc
                            x={0}
                            y={0}
                            radius={0.4}
                            startAngle={0}
                            endAngle={Math.PI * 2}
                            clockwise
                        />
                    </hole>
                </shape>

                <meshPhongMaterial
                    resourceId="tubeMaterial"
                    color={0x00ff00}
                />

            </resources>

            { this.props.entities.map( ( entity ) => {

                if( entity.type === 'wall' ) {

                    return <mesh
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        scale={ entity.scale }
                        castShadow
                        receiveShadow
                    >
                        <geometryResource
                            resourceId="1x1box"
                        />
                        <materialResource
                            resourceId="ornateWall"
                        />
                    </mesh>;

                } else if( entity.type === 'tube' ) {

                    return <TubeStraight
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="tubeMaterial"
                    />;

                } else if( entity.type === 'tubebend' ) {

                    return <TubeBend
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="tubeMaterial"
                    />;

                }

            }) }

        </group>;
    }

}
