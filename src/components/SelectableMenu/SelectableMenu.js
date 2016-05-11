import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { Text, Player } from '../';
import { wrapNumber, getTextWidth } from '../../helpers/Utils';
import shaderFrog from '../../helpers/shaderFrog';
import { glowTextureMaterial } from 'Textures';
import { ENTER, DOWN, UP, J, K, W, S, } from 'helpers/KeyCodes';

const headingScale = new THREE.Vector3( 0.5, 0.5, 0.2 );
const textScale = new THREE.Vector3( 1, 1, 0.5 );
const textScaleWithHeading = new THREE.Vector3( 0.8, 0.8, 0.5 );
const textSpacing = 1.8;
const fontName = 'Sniglet Regular';
const characterMenuRotaiton = new THREE.Euler( Math.PI / 2, Math.PI / 2, -Math.PI / 2 );

export default class SelectableMenu extends Component {
    
    static propTypes = {
        menuOptions: PropTypes.arrayOf( PropTypes.shape({
            heading: PropTypes.string,
            text: PropTypes.string.isRequired,
            onSelect: PropTypes.func.isRequired,
        })).isRequired,
        assets: React.PropTypes.object.isRequired,
        scale: React.PropTypes.object,
        playerTexture: PropTypes.string.isRequired,
        playerTextureLegs: PropTypes.string.isRequired,
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
        };

        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );
        this._onAnimate = this._onAnimate.bind( this );

    }

    componentDidMount() {

        this.mounted = true;
        shaderFrog.get( 'playerMenuBody' ).uniforms.image.value = glowTextureMaterial;

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

        if( keysDown.isFirstPress( DOWN ) || keysDown.isFirstPress( J ) || keysDown.isFirstPress( S ) ) {

            this.props.onClickRegionLeave();
            newState.selectedIndex = wrapNumber( selectedIndex + 1, length );

        } else if( keysDown.isFirstPress( UP ) || keysDown.isFirstPress( K ) || keysDown.isFirstPress( W ) ) {

            this.props.onClickRegionLeave();
            newState.selectedIndex = wrapNumber( selectedIndex - 1, length );

        } else if( keysDown.isFirstPress( ENTER ) ) {

            menuOptions[ selectedIndex ].onSelect();
            return;

        }

        this.setState( newState );

    }

    render() {

        const {
            menuOptions, scale, position, fonts, letters, assets,
            playerTexture, playerTextureLegs,
        } = this.props;
        const { selectedIndex, time } = this.state;

        const { length } = menuOptions;
        const hasHeading = menuOptions.some( data => !!data.heading );

        return <object3D
            onUpdate={ this._onAnimate }
            scale={ scale }
            position={ position }
        >

            { menuOptions.map( ( { text, onSelect, heading }, index ) => <group>
                { heading ? <Text
                    key={ `heading${ index }` }
                    onMouseEnter={ this.onMouseEnter.bind( null, index ) }
                    onMouseDown={ onSelect }
                    position={ new THREE.Vector3(
                        ( textSpacing * index * 1.3 ) - ( textSpacing * length * 0.5 ) - ( textScale.x * 0.3 ),
                        0,
                        0
                    )}
                    scale={ headingScale }
                    fonts={ fonts }
                    letters={ letters }
                    fontName={ fontName }
                    text={ heading }
                    materialId={
                        index === selectedIndex ?
                            'universeInAMenuHover' : 'universeInAMenu'
                    }
                /> : null }
                <Text
                    key={ `text${ index }` }
                    onMouseEnter={ this.onMouseEnter.bind( null, index ) }
                    onMouseDown={ onSelect }
                    position={ new THREE.Vector3(
                        ( textSpacing * index * ( hasHeading ? 1.3 : 1 ) ) - ( textSpacing * length * 0.5 ) + ( hasHeading ? textScale.x * 0.5 : 0 ),
                        0,
                        0
                    )}
                    scale={ hasHeading ? textScaleWithHeading : textScale }
                    fonts={ fonts }
                    letters={ letters }
                    fontName={ fontName }
                    text={ text }
                    materialId={
                        index === selectedIndex ?
                            'universeInALetterHover' : 'universeInALetter'
                    }
                />
            </group> )}

            <Player
                materialId="glowTextureFace"
                assets={ assets }
                rotation={ characterMenuRotaiton }
                radius={ 0.5 }
                time={ time }
                playerTexture={ playerTexture }
                playerTextureLegs={ playerTextureLegs }
                position={
                    new THREE.Vector3(
                        ( textSpacing * selectedIndex * ( hasHeading ? 1.2 : 1 ) ) - ( textSpacing * length * 0.5 ) + ( hasHeading ? textScale.x * 0.5 : 0 ),
                        0,
                        getTextWidth( menuOptions[ selectedIndex ].text, fontName ) * 0.5 + 1,
                    )
                }
            />

        </object3D>;

    }

}
