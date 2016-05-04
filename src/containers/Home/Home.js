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
                    <h1>
                        Coming Soon!
                    </h1>
                    <div className={ gameStyles.viewPort }>
                        <img
                            title="Charisma The (Space) Chameleon Logo"
                            alt="Charisma The (Space) Chameleon Logo"
                            src={ require( '../../../assets/images/splash-logo.jpg' ) }
                            height={ 400 }
                            width={ 400 }
                        />
                    </div>

                    <h2>
                        Gameplay Video
                    </h2>

                    <div
                        className={ styles.splashImage }
                    >
                        <img
                            src={ require( '../../../assets/images/charismas-world.gif' ) }
                            width={ 313 }
                            height={ 261 }
                        />
                    </div>

                    <div className={ gameStyles.extras }>

                        <p>
                            "Charisma The Chameleon" is a browser game where Charisma shrinks infinitely to solve smaller and smaller mazes.
                        </p>
                                
                        { !success ? <form
                            onSubmit={ this.onSubmit }
                            className={ styles.form }
                        >
                            <h2>
                                Be the first to know!
                            </h2>

                            <p>
                                Sign up to receive a <b>one-time only email when the game is ready to play!</b> After the announcement email is sent you won't be emailed again. Your email won't be shared with any third parties, ever.
                            </p>
                            <label htmlFor="email">
                                <b>
                                    email address
                                </b>
                            </label>
                            <br />
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
                            { !success && failure ? <div className={ styles.failure }>
                                { failure}
                            </div> : null }
                        </form> : null }

                        { success ? <div
                            className={ styles.success }
                        >

                            <i className={ cx({ fa: true, 'fa-heart': true, red: true }) } />&nbsp;
                            YOU DID IT!
                        </div> : null }

                        <br />
                        <br />
                        <br />
                        <h5>
                            created by <b>Andrew Ray</b>
                        </h5>
                        <i className={ cx({ fa: true, 'fa-twitter': true, tweet: true }) } />
                        Follow <a href="https://twitter.com/andrewray" target="_blank">
                            @<u>andrewray</u>
                        </a> for updates
                        <br />
                        <br />
                        shaders by <a href="http://shaderfrog.com/app" target="_blank">ShaderFrog</a>

                    </div>
                </div>
            </div>
        </div>;

    }

}
