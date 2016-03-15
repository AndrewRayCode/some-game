import React, { Component, PropTypes } from 'react';

import {
    Shrink, Grow, Wall, MultiWall, Pushy, TubeBend, TubeStraight, Player,
    FinishLine, House, Waterfall, Puffer,
} from '../';

export default class StaticEntities extends Component {

    static propTypes = {
        time: PropTypes.number,
        entities: PropTypes.array.isRequired,
        world: PropTypes.object,
        paused: PropTypes.bool,
        playerRadius: PropTypes.number,
        playerBody: PropTypes.object,
    }

    render() {

        const {
            entities, time, position, scale, shaders, assets, world, paused,
            playerRadius, playerBody,
        } = this.props;

        return <group
            ref="group"
            position={ position }
            scale={ scale }
        >

            { entities.map( ( entity ) => {

                if( entity.type === 'wall' ) {

                    return <Wall
                        shaders={ shaders }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId={ entity.materialId }
                    />;

                } else if( entity.type === 'puffer' ) {

                    return <Puffer
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        impulse={ entity.impulse }
                        maxLength={ entity.maxLength }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        world={ world }
                        paused={ paused }
                        playerRadius={ playerRadius }
                        playerBody={ playerBody }
                        materialId={ entity.materialId }
                    />;

                } else if( entity.type === 'waterfall' ) {

                    return <Waterfall
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        impulse={ entity.impulse }
                        maxLength={ entity.maxLength }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        world={ world }
                        paused={ paused }
                        playerRadius={ playerRadius }
                        playerBody={ playerBody }
                        materialId={ entity.materialId }
                        foamMaterialId={ entity.foamMaterialId }
                    />;

                } else if( entity.type === 'pushy' ) {

                    return <Pushy
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="pushyMaterial"
                    />;

                } else if( entity.type === 'floor' || entity.type === 'multiwall' ) {

                    return <MultiWall
                        ref={ entity.id }
                        key={ entity.id }
                        assets={ assets }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId={ entity.materialId }
                        topMaterialId={ entity.topMaterialId }
                    />;

                } else if( entity.type === 'tube' ) {

                    return <TubeStraight
                        ref={ entity.id }
                        key={ entity.id }
                        assets={ assets }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="tubeMaterial"
                    />;

                } else if( entity.type === 'tubebend' ) {

                    return <TubeBend
                        ref={ entity.id }
                        key={ entity.id }
                        assets={ assets }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        materialId="tubeBendMaterial"
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
                        wrapMaterialId={ entity.wrapMaterialId }
                        materialId={ entity.materialId }
                        wrapMaterialId={ entity.wrapMaterialId }
                    />;

                } else if( entity.type === 'grow' ) {

                    return <Grow
                        time={ time }
                        ref={ entity.id }
                        key={ entity.id }
                        position={ entity.position }
                        rotation={ entity.rotation }
                        scale={ entity.scale }
                        wrapMaterialId={ entity.wrapMaterialId }
                        materialId={ entity.materialId }
                        wrapMaterialId={ entity.wrapMaterialId }
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
