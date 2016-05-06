import React, { Component, PropTypes } from 'react';
import { Vector3, Euler, } from 'three';
import { SelectableMenu, Logo } from 'components';

const cameraPosition = new Vector3( 0, 8, 0 );
const lookAt = new Vector3( 0, 0, 0 );

const logoPosition = new Vector3( -4.5, 0, 0 );
const menuPosition = new Vector3( 1.5, 0, 0 );
const menuScale = new Vector3( 1, 1, 1 ).multiplyScalar( 0.8 );

export default class TitleScreen extends Component {
    
    static propTypes = {
        books: React.PropTypes.array.isRequired,
        playerTexture: React.PropTypes.string.isRequired,
        playerTextureLegs: React.PropTypes.string.isRequired,
        playerTextureTail: React.PropTypes.string.isRequired,
        fonts: React.PropTypes.object.isRequired,
        assets: React.PropTypes.object.isRequired,
        letters: React.PropTypes.object.isRequired,
        onSelect: React.PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
    }

    render() {

        const {
            books, fonts, letters, onClickRegionLeave, onClickRegionEnter,
            assets, playerTexture, playerTextureLegs, playerTextureTail,
            cameraAspect, cameraFov,
        } = this.props;

        return <object3D>

            <perspectiveCamera
                name="mainCamera"
                ref="camera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
            />

            <Logo
                position={ logoPosition }
                fonts={ fonts }
                letters={ letters }
            />

            <SelectableMenu
                fonts={ fonts }
                assets={ assets }
                letters={ letters }
                position={ menuPosition }
                scale={ menuScale }
                onClickRegionEnter={ onClickRegionEnter }
                onClickRegionLeave={ onClickRegionLeave }
                playerTexture={ playerTexture }
                playerTextureLegs={ playerTextureLegs }
                playerTextureTail={ playerTextureTail }
                menuOptions={ books.map( book => ({
                    text: book.name,
                    onSelect: this.props.onSelect.bind( null, book ),
                }) ) }
            />

        </object3D>;

    }

}
