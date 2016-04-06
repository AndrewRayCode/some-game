import React, { Component } from 'react';
import THREE from 'three';

const defaultScale = new THREE.Vector3( 2, 2, 2 );

export default class Player extends Component {

    constructor( props, context ) {

        super( props, context );

        this.state = this._getStateFromProps( props );

    }

    componentWillReceiveProps( nextProps ) {

        if( ( nextProps.radius !== this.props.radius ) ||
           ( nextProps.scale !== this.props.scale )
        ) {
            this.setState( this._getStateFromProps( nextProps ) );
        }

    }

    _getStateFromProps( props ) {

        const { scale, radius } = props;

        return {
            computedScale: scale ?
                defaultScale.clone().multiply( scale ) :
                defaultScale.clone().multiplyScalar( radius )
        };

    }

    render() {

        const {
            position, rotation, quaternion, radius, materialId,
        } = this.props;

        const { computedScale } = this.state;

        return <mesh
            ref="mesh"
            position={ position }
            quaternion={ quaternion }
            rotation={ rotation }
            scale={ computedScale }
        >
            <geometryResource
                resourceId="playerGeometry"
            />
            <materialResource
                resourceId={ materialId }
            />
        </mesh>;

    }

}
