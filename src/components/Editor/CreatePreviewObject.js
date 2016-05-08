import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import {
    Wall, MultiWall, ChamferBox, TubeBend, TubeStraight, Player, EntityGroup,
    Shrink, House, Grow, FinishLine, Waterfall, Puffer, DiamondBox, CurvedWall,
    Placeholder, Pyramid,
} from '../';
import THREE from 'three';

export default class CreatePreviewObject extends Component {

    static propTypes = {
        createType: PropTypes.string.isRequired,
        createPreviewPosition: PropTypes.object.isRequired,
        createPreviewQuaternion: PropTypes.object.isRequired,
        time: PropTypes.number.isRequired,
        scale: PropTypes.object.isRequired,
        shaders: PropTypes.object.isRequired,
        assets: PropTypes.object.isRequired,
        chapterEntities: PropTypes.object
    }

    constructor( props, context ) {

        super( props, context );

    }

    render() {

        const {
            createType, createPreviewPosition, createPreviewQuaternion, time,
            scale, shaders, assets, chapterEntities
        } = this.props;

        switch( createType ) {

            case 'pyramid':

                return <Pyramid
                    scale={ scale }
                    assets={ assets }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'trigger':

                return <Placeholder
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'diamondbox':

                return <DiamondBox
                    assets={ assets }
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'grow':

                return <Grow
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'shrink':

                return <Shrink
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    time={ time }
                    wrapMaterialId="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'finish':

                return <FinishLine
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                    floorMaterialId="ghostMaterial"
                />;

            case 'bridge':
            case 'wall':

                return <Wall
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'curvedwall':

                return <CurvedWall
                    scale={ scale }
                    assets={ assets }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                    topMaterialId="ghostMaterial"
                />;

            case 'chamferbox':

                return <ChamferBox
                    scale={ scale }
                    assets={ assets }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'waterfall':

                return <Waterfall
                    time={ time }
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    helperMaterial="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'puffer':

                return <Puffer
                    time={ time }
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    maxLength={ 2 }
                    velocity={ 2 }
                    colors={[ 0xff0000 ]}
                    helperMaterial="ghostMaterial"
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'house':

                return <House
                    assets={ assets }
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'floor':
            case 'multiwall':

                return <MultiWall
                    assets={ assets }
                    scale={ scale }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                    topMaterialId="ghostMaterial"
                />;

            case 'tube':

                return <TubeStraight
                    scale={ scale }
                    assets={ assets }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'tubebend':

                return <TubeBend
                    scale={ scale }
                    assets={ assets }
                    quaternion={ createPreviewQuaternion }
                    position={ createPreviewPosition }
                    ref="previewPosition"
                    materialId="ghostMaterial"
                />;

            case 'player':

                return <Player
                    assets={ assets }
                    position={ createPreviewPosition }
                    quaternion={ createPreviewQuaternion }
                    materialId="ghostMaterial"
                    ref="previewPosition"
                    radius={ 0.5 }
                />;

            case 'chapter':

                return <group
                    position={ createPreviewPosition }
                    quaternion={ createPreviewQuaternion }
                    scale={ scale }
                    ref="previewGroup"
                >
                    <Wall
                        position={ new THREE.Vector3( 0, 0, 0 ) }
                        ref="previewPosition"
                        materialId="ghostMaterial"
                        position={ new THREE.Vector3( 0, 1, 0 ) }
                        scale={ new THREE.Vector3( 8.01, 2.01, 8.01 ) }
                    />
                    <EntityGroup
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
