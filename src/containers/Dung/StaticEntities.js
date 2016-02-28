import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import Shrink from './Shrink';
import Grow from './Grow';
import Wall from './Wall';
import Floor from './Floor';
import Pushy from './Pushy';
import TubeBend from './TubeBend';
import TubeStraight from './TubeStraight';
import Player from './Player';
import FinishLine from './FinishLine';
import House from './House';
import Textures from './Textures';
import Shaders from './CustomShaders';

export default class StaticEntities extends Component {

    static propTypes = {
        time: PropTypes.number,
        entities: PropTypes.array.isRequired,
    }

    render() {

        const {
            entities, time, position, scale, opacity, shaders, assets
        } = this.props;

        return <group
            ref="group"
            position={ position }
            scale={ scale }
        >
            <resources>
                <boxGeometry
                    resourceId="1x1box"

                    width={1}
                    height={1}
                    depth={1}

                    widthSegments={1}
                    heightSegments={1}
                />
                <boxGeometry
                    resourceId="wallGeometry"
                    width={1}
                    height={1}
                    depth={1}
                    widthSegments={1}
                    heightSegments={1}
                />

                { Object.keys( Textures ).map( key =>
                    <meshPhongMaterial
                        key={ key }
                        resourceId={ key }
                        color={ 0xffffff }
                    >
                        <texture
                            url={ Textures[ key ] }
                            wrapS={ THREE.RepeatWrapping }
                            wrapT={ THREE.RepeatWrapping }
                            anisotropy={16}
                        />
                    </meshPhongMaterial>
                )}

                { Object.keys( Shaders ).map( key =>
                    <rawShaderMaterial
                        key={ key }
                        resourceId={ key }
                        vertexShader={ shaders[ key ].json.vertex }
                        fragmentShader={ shaders[ key ].json.fragment }
                        uniforms={ shaders[ key ].material.uniforms }
                    />
                )}

                <meshPhongMaterial
                    resourceId="finishFlag"
                    side={ THREE.DoubleSide }
                    transparent
                    opacity={ 0.7 }
                />

                <meshPhongMaterial
                    resourceId="tubeMaterial"
                    side={ THREE.DoubleSide }
                    transparent
                >
                    <texture
                        url={ require( '../Game/tube-pattern-1.png' ) }
                        wrapS={ THREE.RepeatWrapping }
                        wrapT={ THREE.RepeatWrapping }
                        anisotropy={ 16 }
                    />
                </meshPhongMaterial>

            </resources>

            { entities.map( ( entity ) => {

                if( entity.type === 'wall' ) {

                    return <Wall
                        shaders={ shaders }
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId={ entity.materialId }
                    />;

                } else if( entity.type === 'pushy' ) {

                    return <Pushy
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="pushyMaterial"
                    />;

                } else if( entity.type === 'floor' ) {

                    return <Floor
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        assets={ assets }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId={ entity.materialId }
                    />;

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

                } else if( entity.type === 'house' ) {

                    return <House
                        ref={ entity.id }
                        key={ entity.id }
                        assets={ assets }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="sfHouse"
                    />;

                } else if( entity.type === 'finish' ) {

                    return <FinishLine
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="finishFlag"
                        floorMaterialId="ornateWall1"
                    />;

                } else if( entity.type === 'shrink' ) {

                    return <Shrink
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        wrapMaterialId="shrinkWrapMaterial"
                        materialId="shrinkMaterial"
                    />;

                } else if( entity.type === 'grow' ) {

                    return <Grow
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        wrapMaterialId="growWrapMaterial"
                        materialId="growMaterial"
                    />;


                } else if( entity.type === 'player' ) {

                    return <Player
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        quaternion={ entity.quaternion }
                        radius={ 0.5 }
                        materialId="playerMaterial"
                    />;

                } else {

                    console.warn( 'Unknown entity type!', entity );
                    return <group />;

                }

            }) }

        </group>;

    }

}
