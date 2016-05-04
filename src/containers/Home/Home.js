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
        loading: state.splashSubmit.loading,
        success: state.splashSubmit.success,
        failure: state.splashSubmit.failure,
    }),
    dispatch => bindActionCreators({ submitSplashEmail }, dispatch )
)
export default class Home extends Component {

    constructor( props, context ) {

        super( props, context );

        this.state = {};
        this.onSubmit = this.onSubmit.bind( this );
        this.onChangeEmail = this.onChangeEmail.bind( this );

    }

    onChangeEmail( event ) {

        this.setState({ email: event.target.value });

    }

    onSubmit( event ) {

        event.preventDefault();
        this.props.submitSplashEmail( this.state.email );

    }

    render() {

        const { loading, failure, success, } = this.props;

        return <div>
            <Helmet title="Home" />
            <div className={ gameStyles.wrap }>
                <div className={ gameStyles.viewportContainer }>
                    <div className={ gameStyles.viewPort }>
                        <img
                            title="Charisma The (Space) Chameleon Logo"
                            alt="Charisma The (Space) Chameleon Logo"
                            src={ require( '../../../assets/images/splash-logo.jpg' ) }
                        />
                    </div>

                    <div className={ gameStyles.extras }>

                        <h4>
                            Get Notified When the Demo is Live:
                        </h4>

                        { success ? <div>
                            YOU DID IT
                        </div> : <form onSubmit={ this.onSubmit }>
                            <label htmlFor="email">Email address:</label>
                            <input
                                disabled={ loading }
                                type="email"
                                placeholder="Your email address"
                                onChange={ this.onChangeEmail }
                                value={ this.state.email }
                            />
                            <input
                                disabled={ loading }
                                type="submit"
                                value="submit"
                            />
                            { failure }
                        </form> }

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
