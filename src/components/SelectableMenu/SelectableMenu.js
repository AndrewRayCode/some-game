import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text, Player } from '../';
import { wrapNumber, getTextWidth } from '../../helpers/Utils';
import shaderFrog from '../../helpers/shaderFrog';

const textScale = new THREE.Vector3( 1, 1, 0.5 );
const textSpacing = 1.8;
const fontName = 'Sniglet Regular';
const characterMenuRotaiton = new THREE.Euler( Math.PI / 2, Math.PI / 2, -Math.PI / 2 );

export default class SelectableMenu extends Component {
    
    static propTypes = {
        menuOptions: PropTypes.arrayOf(PropTypes.shape({
            text: PropTypes.string.isRequired,
            onSelect: PropTypes.func.isRequired,
        })).isRequired,
        assets: React.PropTypes.object.isRequired,
        scale: React.PropTypes.object,
        playerTexture: PropTypes.string.isRequired,
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
            time: 0,
            glowTextureMaterial: __CLIENT__ ? THREE.ImageUtils.loadTexture(
                require( '../../../assets/brick-pattern-1.png' )
            ) : null
        };

        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );
        this._onAnimate = this._onAnimate.bind( this );

    }

    componentDidMount() {

        this.mounted = true;
        shaderFrog.get( 'playerMenuBody' ).uniforms.image.value = this.state.glowTextureMaterial;

    }

    componentWillUnmount() {

        this.mounted = false;

    }

    onMouseEnter( selectedIndex ) {

        this.props.onClickRegionEnter();
        this.setState({ selectedIndex });

    }

    onMouseLeave() {

        this.props.onClickRegionLeave();

    }

    _onAnimate( elapsedTime, delta, keysDown ) {

        if( !this.mounted ) {
            return;
        }

        const { menuOptions } = this.props;
        const { length } = menuOptions;
        const { selectedIndex } = this.state;
        const newState = {
            time: elapsedTime
        };

        if( keysDown.isFirstPress( 'DOWN' ) || keysDown.isFirstPress( 'J' ) || keysDown.isFirstPress( 'S' ) ) {

            this.props.onClickRegionLeave();
            newState.selectedIndex = wrapNumber( selectedIndex + 1, length );

        } else if( keysDown.isFirstPress( 'UP' ) || keysDown.isFirstPress( 'K' ) || keysDown.isFirstPress( 'W' ) ) {

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
            menuOptions, scale, position, fonts, letters, assets, playerTexture
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
                    fontName={ fontName }
                    text={ text }
                    materialId={
                        index === selectedIndex ?
                            'universeInAMenuHover' : 'universeInAMenu'
                    }
                />
            )}

            <Player
                materialId="glowTexture"
                assets={ assets }
                rotation={ characterMenuRotaiton }
                radius={ 0.5 }
                time={ time }
                playerTexture={ playerTexture }
                position={
                    new THREE.Vector3(
                        ( textSpacing * selectedIndex ) - ( textSpacing * length * 0.5 ),
                        0,
                        getTextWidth( menuOptions[ selectedIndex ].text, fontName ) * 0.5 + 1,
                    )
                }
            />

        </object3D>;

    }

}
