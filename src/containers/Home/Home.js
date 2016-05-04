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

        return <div className={ styles.colWrap }>
            <Helmet title="Charisma The Chameleon" />
            <div className={ styles.col }>
                <div className={ gameStyles.viewportContainer }>
                    <div className={ gameStyles.viewPort }>
                        <img
                            title="Charisma The (Space) Chameleon Logo"
                            alt="Charisma The (Space) Chameleon Logo"
                            src={ require( '../../../assets/images/splash-logo.jpg' ) }
                            className={ styles.imgAuto }
                        />
                    </div>

                    <h2>
                        <center>Gameplay Video</center>
                    </h2>

                    <div
                        className={ styles.splashImage }
                    >
                        <img
                            src={ require( '../../../assets/images/charismas-world.gif' ) }
                            alt="Charisma The Chameleon Gameplay Video"
                            title="Charisma The Chameleon Gameplay Video"
                            className={ styles.imgAuto }
                        />
                    </div>
                </div>
            </div><div className={ styles.col }>
                <div className={ styles.colContentWrap }>
                    <div
                        className={ styles.cols }
                    >
                        <div className={ styles.coll }>
                            <i className={ cx({ fa: true, 'fa-facebook': true, icon: true }) } />
                            <a href="https://www.facebook.com/charismachameleon" target="_blank">
                                <u>Like Charisma</u>
                            </a> on Facebook!
                        </div><div className={ styles.coll }>
                            Follow{' '}
                            <i className={ cx({ fa: true, 'fa-twitter': true, icon: true, tweet: true }) } />
                            <a href="https://twitter.com/andrewray" target="_blank">
                                @<u>andrewray</u>
                            </a> for updates!
                        </div>
                    </div>

                    { !success ? <form
                        onSubmit={ this.onSubmit }
                        className={ styles.form }
                    >
                        <h2>
                            Be the first to know!
                        </h2>

                        <p>
                            Sign up to receive a <b>one-time only email when the game is ready to play!</b>
                        </p>
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
                        <p style={{ fontStyle: 'italic', fontSize: '12px', opacity: 0.6 }}>
                            After the announcement email is sent you won't be emailed again. Your email won't be shared with any third parties, ever.
                        </p>
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
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p
                        >
                        "Charisma The Chameleon" is a browser game where Charisma shrinks infinitely to solve smaller and smaller mazes. Inspired by the quality of Nintendo 64 games, I aim to achieve a well crafted, complete browser game experience.
                    </p>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>
                        created by <a href="https://twitter.com/andrewray" target="_blank" className={ styles.not }>Andrew Ray</a>
                    </p>
                    <p>
                        shaders by <a href="http://shaderfrog.com/app" target="_blank" className={ styles.not }>ShaderFrog</a>
                    </p>
                </div>
            </div>
        </div>;

    }

}
