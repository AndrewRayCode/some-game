import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import styles from './Picker.scss';

export default class TexturePicker extends Component {

    static propTypes = {
        shaders: PropTypes.object.isRequired,
        textures: PropTypes.object.isRequired,
        selectedId: PropTypes.string,
        onSelect: PropTypes.func.isRequired
    }

    constructor( props, context ) {

        super( props, context );
        this.state = { isOpen: false };
        this.onToggle = this.onToggle.bind( this );

    }

    onToggle( event ) {

        this.setState({
            isOpen: !this.state.isOpen,
        });

    }

    render() {

        const {
            shaders, textures, onSelect, selectedId
        } = this.props;

        const { isOpen } = this.state;

        return <div
            className={ styles.pickerWrap }
        >
            <button
                onClick={ this.onToggle }
            >
                <img
                    src={ textures[ selectedId ] }
                    height={ 20 }
                    width={ 20 }
                />
                { selectedId }
            </button>

            { isOpen ? <div
                className={ styles.picker }
            >
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
            </div> : null }
        </div>;

    }

}
