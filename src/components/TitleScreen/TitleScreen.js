import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { browserHistory } from 'react-router';
import KeyCodes from '../../helpers/KeyCodes';
import { without } from '../../helpers/Utils';
import styles from '../../containers/Game/Game.scss';
import classNames from 'classnames/bind';
import { Text } from '../';

const cx = classNames.bind( styles );
const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );

export default class TitleScreen extends Component {
    
    static propTypes = {
        books: React.PropTypes.array.isRequired,
        fonts: React.PropTypes.object.isRequired,
        onSelect: React.PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.keysDown = {};
        this.state = {
            hoveredBook: null,
        };

        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );

    }


    onMouseDown( book, event ) {

        const {
            hoveredBook
        } = this.state;

        if( hoveredBook ) {

            this.props.onSelect( hoveredBook );

        }

    }

    onMouseEnter( book, event ) {

        this.props.onClickRegionEnter();
        this.setState({ hoveredBook: book });

    }

    onMouseLeave( book, event ) {

        this.props.onClickRegionLeave();
        if( this.state.hoveredBook === book ) {

            this.setState({ hoveredBook: null });

        }

    }

    render() {

        const { books, fonts } = this.props;
        const { hoveredBook } = this.state;

        return <object3D>

            <perspectiveCamera
                name="mainCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
                ref="camera"
            />

            <Text
                position={ new THREE.Vector3( -4.5, 0, 0 ) }
                fonts={ fonts }
                fontName="Sniglet Regular"
                text="Today I'm A Galaxy"
                materialId="textMaterial"
            />

            { books.map( ( book, index ) =>
                <Text
                    onMouseEnter={ this.onMouseEnter.bind( null, book ) }
                    onMouseLeave={ this.onMouseLeave.bind( null, book ) }
                    onMouseDown={ this.onMouseDown.bind( null, book ) }
                    ref={ `book${ book.id }` }
                    position={ new THREE.Vector3( index * 1.4, 0, 0 ) }
                    key={ book.id }
                    text={ book.name }
                    fonts={ fonts }
                    fontName="Sniglet Regular"
                    materialId={
                        book === hoveredBook ?
                            'textMaterialHover' : 'textMaterial'
                    }
                />
            )}
        </object3D>;

    }

}
