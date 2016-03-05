import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { resourceIds, allResourcesIncludingEditor } from '../../resources';

@connect(
    state => {

        const { letters, shaders } = state;
        const lettersArray = Object.values( letters[ 'Sniglet Regular' ] );
        const shadersArray = Object.values( shaders ).map( shader => shader.resource );
        return { lettersArray, shadersArray };

    }
)
export default class EditorResources extends Component {

    render() {

        const {
            lettersArray, shadersArray,
        } = this.props;

        return <resources>
            { allResourcesIncludingEditor }
            { lettersArray }
            { shadersArray }
        </resources>;

    }

}
