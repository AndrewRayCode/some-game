import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import {
    Wall, Floor, Pushy, TubeBend, TubeStraight, Player, StaticEntities,
    Shrink, House, Grow, FinishLine, Waterfall,
} from '../../components';
import THREE from 'three';

export default class Editor extends Component {

    static propTypes = {
        createType: PropTypes.string.isRequired,
        createPreviewPosition: PropTypes.object.isRequired,
        createPreviewRotation: PropTypes.object.isRequired,
        time: PropTypes.number.isRequired,
        gridScale: PropTypes.object.isRequired,
        shaders: PropTypes.object.isRequired,
        assets: PropTypes.object.isRequired,
        chapterEntities: PropTypes.object
    }

    constructor( props, context ) {

        super( props, context );

    }

    render() {

        const {
            createType, createPreviewPosition, createPreviewRotation, time,
            gridScale, shaders, assets, chapterEntities
        } = this.props;

        switch( createType ) {

            case 'grow':

                return <Grow
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'shrink':

                return <Shrink
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'finish':

                return <FinishLine
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                    floorMaterialId="ghostMaterial"
                />;

            case 'wall':

                return <Wall
                    shaders={ shaders }
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'pushy':

                return <Pushy
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'waterfall':

                return <Waterfall
                    time={ time }
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'house':

                return <House
                    assets={ assets }
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'floor':

                return <Floor
                    assets={ assets }
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'tube':

                return <TubeStraight
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'tubebend':

                return <TubeBend
                    scale={ gridScale }
                    rotation={ createPreviewRotation }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'player':

                return <Player
                    position={ createPreviewPosition }
                    rotation={ createPreviewRotation }
                    materialId="ghostMaterial"
                    ref="previewPosition"
                    radius={ 0.5 }
                />;

            case 'chapter':

                return <group
                    position={ createPreviewPosition }
                    quaternion={ createPreviewRotation }
                    scale={ gridScale }
                    ref="previewGroup"
                >
                    <Wall
                        shaders={ shaders }
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        ref="previewPosition"
                        materialId="ghostMaterial"
                        position={ new THREE.Vector3( 0, 1, 0 ) }
                        scale={ new THREE.Vector3( 8.01, 2.01, 8.01 ) }
                    />
                    <StaticEntities
                        shaders={ shaders }
                        assets={ assets }
                        time={ time }
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        entities={ chapterEntities }
                    />
                </group>;

            default:
                return null;

        }

    }

}
