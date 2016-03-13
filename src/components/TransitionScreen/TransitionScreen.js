import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { getFrustrumAt } from '../../helpers/Utils';

const gameWidth = 400;
const gameHeight = 400;
const cameraAspect = gameWidth / gameHeight;
const cameraFov = 75;
const cameraPosition = new THREE.Vector3( 0, 8, 0 );
const lookAt = new THREE.Vector3( 0, 0, 0 );

const sceneOffset = new THREE.Vector3( -300, -100, -200 );

const bgRotation = new THREE.Euler( -Math.PI / 2, 0, Math.PI / 2 );
const bgPosition = new THREE.Vector3( 0, 0, 0 );

const frustum = getFrustrumAt( cameraPosition.y, cameraFov, cameraAspect );
const bgScale = new THREE.Vector3( 1, 1, 1 ).multiplyScalar( frustum.size().x );

export default class ConfirmRestartScreen extends Component {
    
    static propTypes = {
        letters: PropTypes.object.isRequired,
        fonts: PropTypes.object.isRequired,
        onConfirm: PropTypes.func.isRequired,
        onDeny: PropTypes.func.isRequired,
        onClickRegionLeave: PropTypes.func.isRequired,
        onClickRegionEnter: PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );

        this.state = {};

        this.onMouseDown = this.onMouseDown.bind( this );
        this.onMouseEnter = this.onMouseEnter.bind( this );
        this.onMouseLeave = this.onMouseLeave.bind( this );

    }

    onMouseDown( hovered, event ) {

        if( hovered === 'confirm' ) {

            this.props.onConfirm();

        } else if( hovered === 'deny' ) {

            this.props.onDeny();

        }

    }

    onMouseEnter( hovered, event ) {

        this.props.onClickRegionEnter();
        this.setState({ [ hovered ]: true });

    }

    onMouseLeave( hovered, event ) {

        this.props.onClickRegionLeave();
        this.setState({ [ hovered ]: null });

    }

    render() {

        const { fonts, letters } = this.props;
        const { confirm, deny } = this.state;

        return <object3D
            position={ sceneOffset }
        >

            <perspectiveCamera
                name="transitionCamera"
                fov={ cameraFov }
                aspect={ cameraAspect }
                near={ 0.1 }
                far={ 1000 }
                position={ cameraPosition }
                lookAt={ lookAt }
            />

            <mesh
                scale={ bgScale }
                rotation={ bgRotation }
                position={ bgPosition }
            >
                <geometryResource
                    resourceId="1x1plane"
                />
                <materialResource
                    resourceId="fractalTransition"
                />
            </mesh>

        </object3D>;

    }

}
