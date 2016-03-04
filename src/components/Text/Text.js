import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const fontRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 )
);

export default class Text extends Component {

    static propTypes = {
        fontName: PropTypes.string.isRequired,
        fonts: PropTypes.object.isRequired,
        letters: PropTypes.object.isRequired,
        text: PropTypes.string.isRequired,
        position: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string.isRequired,
    }

    constructor( props ) {

        super( props );

        this.state = {
            splitText: props.text.split('')
        };

    }

    componentWillReceiveProps( nextProps ) {

        if( nextProps.text !== this.props.text ) {
            this.setState({
                splitText: nextProps.text.split('')
            });
        }

    }

    render() {

        const {
            fonts, fontName, position, scale, materialId, onMouseEnter,
            onMouseLeave, onMouseDown, letters
        } = this.props;

        const { splitText } = this.state;

        if( !fonts[ fontName ] ) {

            return null;

        }

        const textData = splitText.reduce( ( data, letter, index ) => {

            if( data.letter === ' ' ) {
                return {
                    ...data,
                    offset: data.offset + 0.2
                };
            }

            return {
                offset: data.offset + letters[ fontName ][ letter ].props.userData.ha * 0.001,
                meshes: [
                    ...data.meshes,
                    <mesh
                        key={ index }
                        position={ new THREE.Vector3(
                            data.offset, 0, 0
                        ) }
                    >
                        <geometryResource
                            resourceId={ `${ fontName }_${ letter }` }
                        />
                        <materialResource
                            resourceId={ materialId }
                        />
                    </mesh>
                ]
            };

        }, { offset: 0, meshes: [] } );

        return <group
            ref="group"
            position={ position }
            quaternion={ fontRotation }
            scale={ scale }
        >

            <mesh
                scale={ new THREE.Vector3( textData.offset, 1.2, 1.2 ) }
                onMouseEnter={ onMouseEnter }
                onMouseLeave={ onMouseLeave }
                onMouseDown={ onMouseDown }
            >
                <geometryResource
                    resourceId="1x1box"
                />
                <materialResource
                    resourceId="transparent"
                />
            </mesh>

            <group
                position={ new THREE.Vector3( -textData.offset / 2, -0.5, -0.5 ) }
            >
                { textData.meshes }
            </group>

        </group>;

    }

}
