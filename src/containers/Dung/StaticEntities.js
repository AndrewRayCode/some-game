import React, { Component } from 'react';
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

export default class StaticEntities extends Component {

    constructor(props, context) {

        super(props, context);

    }

    render() {

        const { entities, time, position, scale, opacity } = this.props;

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

                { Object.keys( Textures ).map( ( key ) => {

                    return <meshPhongMaterial
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
                    </meshPhongMaterial>;

                }) }

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

            { this.props.entities.map( ( entity ) => {

                if( entity.type === 'wall' ) {

                    return <Wall
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
                        store={ this.props.store }
                        ref={ entity.id }
                        key={ entity.id }
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
