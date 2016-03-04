import React, { Component, PropTypes } from 'react';
import THREE from 'three';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { resourceIds, allResources } from '../../resources';

@connect(
    state => {

        const { letters } = state;

        const lettersArray = Object.values( letters[ 'Sniglet Regular' ] );
        console.log('created',lettersArray);
        return { lettersArray };

    }
)
export default class Resources extends Component {

    render() {

        const {
            lettersArray,
        } = this.props;

        return <resources>
            { allResources }
            { lettersArray }
        </resources>;

    }

}

