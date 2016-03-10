import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';

export default class TexturePicker extends Component {

    static propTypes = {
        shaders: PropTypes.object.isRequired,
        textures: PropTypes.object.isRequired,
        selectedId: PropTypes.string,
        onSelect: PropTypes.func.isRequired
    }

    constructor( props, context ) {

        super( props, context );

    }

    render() {

        const {
            shaders, textures, onSelect, selectedId
        } = this.props;

        return <div>
            { Object.keys( textures ).map( key =>
                <button onClick={ onSelect( key ) }
                    style={
                        selectedId === key ? {
                            border: 'inset 1px blue'
                        } : null
                    }
                    key={ key }
                >
                    <img
                        src={ textures[ key ] }
                        height={ 20 }
                        width={ 20 }
                    />
                </button>
            )}
            { Object.keys( shaders ).map( key =>
                <button onClick={ onSelect( key ) }
                    style={
                        selectedId === key ? {
                            border: 'inset 1px blue'
                        } : null
                    }
                    key={ key }
                >
                    { key }
                </button>
            )}
        </div>;

    }

}
