import React, { Component, PropTypes } from 'react';
import { without } from '../../helpers/Utils';

export default class ArrayEditor extends Component {
    
    static propTypes = {
        value: React.PropTypes.array.isRequired,
        onChange: React.PropTypes.func.isRequired,
    }

    constructor( props, context ) {

        super( props, context );
        this.onElementChange = this.onElementChange.bind( this );
        this.onElementRemove = this.onElementRemove.bind( this );
        this.onElementAdd = this.onElementAdd.bind( this );

    }

    onElementChange( index, event ) {

        const { onChange, value } = this.props;

        onChange([
            ...value.slice( 0, index ),
            event.target.value,
            ...value.slice( index + 1 ),
        ]);

    }

    onElementRemove( index ) {

        const { onChange, value } = this.props;

        onChange([
            ...value.slice( 0, index ),
            ...value.slice( index + 1 ),
        ]);

    }

    onElementAdd( index ) {

        const { onChange, value } = this.props;

        onChange([
            ...value,
            0
        ]);

    }

    render() {

        const { value } = this.props;

        return <div>
            { value.map( ( element, index ) => <div>
                <input
                    value={ element }
                    onChange={ this.onElementChange.bind( null, index ) }
                />
                <button
                    onClick={ this.onElementRemove.bind( null, index ) }
                >
                    &times;
                </button>
            </div> ) }
            <button
                onClick={ this.onElementAdd }
            >
                +
            </button>
        </div>;

    }

}
