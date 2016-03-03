import React, { Component, PropTypes } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import { browserHistory } from 'react-router';
import KeyCodes from '../../helpers/KeyCodes';
import { without } from '../../helpers/Utils';
import styles from '../../containers/Game/Game.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind( styles );
const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );
const raycaster = new THREE.Raycaster();

const fontRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 )
);

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

            <resources>
                <textGeometry
                    resourceId="title"
                    size={ 0.6 }
                    height={ 0.2 }
                    bevelEnabled
                    bevelThickness={ 0.02 }
                    bevelSize={ 0.01 }
                    font={ fonts[ 'Sniglet Regular' ] }
                    text="Today I'm A Galaxy"
                />
                { books.map( book =>
                    <textGeometry
                        key={ book.id }
                        resourceId={ book.name }
                        size={ 0.8 }
                        height={ 0.2 }
                        bevelEnabled
                        bevelThickness={ 0.02 }
                        bevelSize={ 0.01 }
                        font={ fonts[ 'Sniglet Regular' ] }
                        text={ book.name }
                    />
                )}
                <meshPhongMaterial
                    resourceId="textMaterial"
                />
                <meshPhongMaterial
                    color={ 0xff0000 }
                    resourceId="textMaterialHover"
                />
            </resources>

            <mesh
                position={ new THREE.Vector3(
                    -4.5,
                    0,
                    4.3
                ) }
                quaternion={ fontRotation }
            >
                <geometryResource
                    resourceId="title"
                />
                <materialResource
                    resourceId="textMaterial"
                />
            </mesh>

            { books.map( ( book, index ) =>
                <mesh
                    onMouseEnter={ this.onMouseEnter.bind( null, book ) }
                    onMouseLeave={ this.onMouseLeave.bind( null, book ) }
                    onMouseDown={ this.onMouseDown.bind( null, book ) }
                    ref={ `book${ book.id }` }
                    position={ new THREE.Vector3(
                        index * 1.4,
                        0,
                        book.name.length * 0.35,
                    ) }
                    key={ book.id }
                    quaternion={ fontRotation }
                >
                    <geometryResource
                        resourceId={ book.name }
                    />
                    <materialResource
                        resourceId={
                            book === hoveredBook ?
                                'textMaterialHover' : 'textMaterial'
                        }
                    />
                </mesh>
            )}
        </object3D>;

    }

}
