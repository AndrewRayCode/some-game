import React, { Component, PropTypes } from 'react';
import THREE from 'three';

const fontRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 )
);

export default class Text extends Component {

    static propTypes = {
        fontName: PropTypes.string.isRequired,
        fonts: PropTypes.object.isRequired,
        text: PropTypes.string.isRequired,
        position: PropTypes.object,
        scale: PropTypes.object,
        materialId: PropTypes.string.isRequired,
    }

    constructor( props ) {

        super( props );

        this.state = {
            letters: props.text.split('')
        };

    }

    componentWillReceiveProps( nextProps ) {

        if( nextProps.text !== this.props.text ) {
            this.setState({
                letters: nextProps.text.split('')
            });
        }

    }

    render() {

        const {
            fonts, fontName, position, scale, materialId, onMouseEnter,
            onMouseLeave, onMouseDown
        } = this.props;

        const { letters } = this.state;
        const width = letters.length;

        return <group
            ref="group"
            position={ position }
            quaternion={ fontRotation }
            scale={ scale }
        >

            <mesh
                scale={ new THREE.Vector3( width, 1.2, 1.2 ) }
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

            { fonts[ fontName ] ? letters.map( ( letter, index ) =>
                letter === ' ' ? null : <mesh
                    key={ index }
                    position={ new THREE.Vector3(
                        index - ( width / 2 ), -0.5, -0.5
                    ) }
                >
                    <geometryResource
                        resourceId={ `${ fontName }_${ letter }` }
                    />
                    <materialResource
                        resourceId={ materialId }
                    />
                </mesh>
            ) : null }

        </group>;

    }

}
