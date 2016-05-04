import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import Helmet from 'react-helmet';

/**
 * Wrapper component containing HTML metadata and boilerplate tags.
 * Used in server-side code only to wrap the string output of the
 * rendered route component.
 *
 * The only thing this component doesn't (and can't) include is the
 * HTML doctype declaration, which is added to the rendered output
 * by the server.js file.
 */
export default class Html extends Component {
    static propTypes = {
        assets: PropTypes.object,
        component: PropTypes.node,
        store: PropTypes.object
    };

    render() {
        const {assets, component, store} = this.props;
        const content = component ? ReactDOM.renderToString(component) : '';
        const head = Helmet.rewind();

        return <html lang="en-us">
            <head>
                {head.base.toComponent()}
                {head.title.toComponent()}
                {head.meta.toComponent()}
                {head.link.toComponent()}
                {head.script.toComponent()}

                <link rel="shortcut icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* styles (will be present only in production with webpack extract text plugin) */}
                {Object.keys(assets.styles).map((style, key) =>
                    <link href={assets.styles[style]} key={key} media="screen, projection"
                        rel="stylesheet" type="text/css" charSet="UTF-8"/>
                )}

                {/* (will be present only in development mode) */}
                {/* outputs a <style/> tag with all App.scss + it could be CurrentPage.scss. */}
                {/* can smoothen the initial style flash (flicker) on page load in development mode. */}
                {/* ideally one could also include here the style for the current page (Home.scss, About.scss, etc) */}
                { Object.keys(assets.styles).length === 0 ? <style dangerouslySetInnerHTML={{__html: require('../containers/App/App.scss')._style}}/> : null }
            </head>
            <body>
                <div id="content" dangerouslySetInnerHTML={{__html: content}}/>
                <script dangerouslySetInnerHTML={{__html: `window.__data=${serialize(store.getState())};`}} charSet="UTF-8"/>
                <script src={assets.javascript['common.js']} charSet="UTF-8"/>
                <script src={assets.javascript.main} charSet="UTF-8"/>
            </body>
            <script dangerouslySetInnerHTML={{ __html: `
                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

                ga('create', 'UA-77323001-1', 'auto');
                ga('send', 'pageview');`
            }} />
        </html>;

    }

}
