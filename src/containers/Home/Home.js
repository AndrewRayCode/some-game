import React, { Component } from 'react';
import { Link } from 'react-router';
import config from '../../config';
import Helmet from 'react-helmet';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { submitSplashEmail, } from 'redux/modules/users';

import gameStyles from '../Game/Game.scss';
import styles from './Home.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind( styles );

@connect(
    state => ({
        loading: state.splashLoading.loading,
        success: state.splashLoading.success,
        failure: state.splashLoading.failure,
    }),
    dispatch => bindActionCreators({ submitSplashEmail }, dispatch )
)
export default class Home extends Component {

    constructor() {

        super();

        this.state = {};
        this.onSubmit = this.onSubmit.bind( this );
        this.onChangeEmail = this.onChangeEmail.bind( this );

    }

    onChangeEmail( event ) {

        this.setState({ email: event.target.value });

    }

    onSubmit() {

        this.props.submitSplashEmail( this.state.email );

    }

    render() {

        return <div>
            <Helmet title="Home" />
            <div className={ gameStyles.wrap }>
                <div className={ gameStyles.viewportContainer }>
                    <div className={ gameStyles.extras }>

                        <h4>
                            Get Notified When the Demo is Live:
                        </h4>

                        <form onSubmit={ this.onSubmit }>
                            <label htmlFor="email">Email address:</label>
                            <input
                                type="email"
                                placeholder="Your email address"
                                onChange={ this.onChangeEmail }
                                value={ this.state.email }
                            />
                            <input type="submit" value="submit" />
                        </form>

                        <h5>
                            created by <b>Andrew Ray</b>
                        </h5>
                        <i className={ cx({ fa: true, 'fa-twitter': true, tweet: true }) } />
                        <a href="https://twitter.com/andrewray" target="_blank">
                            @<u>andrewray</u>
                        </a>
                        <br />
                        <br />
                        shaders by <a href="http://shaderfrog.com/app" target="_blank">ShaderFrog</a>
                    </div>
                </div>
            </div>
        </div>;

    }

}
