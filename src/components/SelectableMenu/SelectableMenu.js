import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text } from '../';
import { wrapNumber } from '../../helpers/Utils';

const textScale = new THREE.Vector3( 1, 1, 0.5 );
const textSpacing = 1.8;

export default class SelectableMenu extends Component {
    
    static propTypes = {
        menuOptions: PropTypes.arrayOf(PropTypes.shape({
            text: PropTypes.string.isRequired,
            onSelect: PropTypes.func.isRequired,
        })).isRequired,
        scale: React.PropTypes.object,
        position: React.PropTypes.object,
        fonts: React.PropTypes.object.isRequired,
        letters: React.PropTypes.object.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = {
            selectedIndex: 0,
            time: 0
        };

        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );
        this._onAnimate = this._onAnimate.bind( this );

    }

    onMouseEnter( selectedIndex ) {

        this.props.onClickRegionEnter();
        this.setState({ selectedIndex });

    }

    onMouseLeave() {

        this.props.onClickRegionLeave();

    }

    _onAnimate( elapsedTime, delta, keysDown ) {

        const { menuOptions } = this.props;
        const { length } = menuOptions;
        const { selectedIndex } = this.state;
        const newState = {
            time: elapsedTime
        };

        if( keysDown.isFirstPress( 'DOWN' ) ) {

            this.props.onClickRegionLeave();
            newState.selectedIndex = wrapNumber( selectedIndex + 1, length );

        } else if( keysDown.isFirstPress( 'UP' ) ) {

            this.props.onClickRegionLeave();
            newState.selectedIndex = wrapNumber( selectedIndex - 1, length );

        } else if( keysDown.isFirstPress( 'ENTER' ) ) {

            menuOptions[ selectedIndex ].onSelect();
            return;

        }

        this.setState( newState );

    }

    render() {

        const {
            menuOptions, scale, position, fonts, letters,
        } = this.props;
        const { selectedIndex, time } = this.state;

        const { length } = menuOptions;

        return <object3D
            onUpdate={ this._onAnimate }
            scale={ scale }
            position={ position }
        >

            { menuOptions.map( ( { text, onSelect }, index ) =>
                <Text
                    key={ index }
                    onMouseEnter={ this.onMouseEnter.bind( null, index ) }
                    onMouseDown={ onSelect }
                    position={ new THREE.Vector3(
                        ( textSpacing * index ) - ( textSpacing * length * 0.5 ),
                        0,
                        0
                    )}
                    scale={ textScale }
                    fonts={ fonts }
                    letters={ letters }
                    fontName="Sniglet Regular"
                    text={ text }
                    materialId={
                        index === selectedIndex ?
                            'universeInAMenuHover' : 'universeInAMenu'
                    }
                />
            )}

            <mesh
                rotation={ new THREE.Euler(
                    THREE.Math.degToRad( time * 50 ),
                    0,
                    0
                ) }
                position={
                    new THREE.Vector3(
                        ( textSpacing * selectedIndex ) - ( textSpacing * length * 0.5 ),
                        0,
                        menuOptions[ selectedIndex ].text.length * 0.5
                    )
                }
                ref="mesh"
            >
                <geometryResource
                    resourceId="radius1sphere"
                />
                <materialResource
                    resourceId="shrinkColors"
                />
            </mesh>

        </object3D>;

    }

}
