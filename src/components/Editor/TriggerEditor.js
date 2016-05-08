import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import {
    ArrayEditor
} from 'components';
import THREE from 'three';

export default class TriggerEditor extends Component {

    static propTypes = {
        triggerId: PropTypes.string.isRequired,
        trigger: PropTypes.object.isRequired,
        onPropertyChange: PropTypes.func.isRequired,
    }

    render() {

        const {
            triggerId, trigger, onPropertyChange,
        } = this.props;

        const { acitonType, texts, targetEntityId } = trigger;

        let editor;

        switch( acitonType ) {

            case 'text':
                editor = <div>
                    <b>Texts:</b>
                    <ArrayEditor
                        value={ texts || [] }
                        onChange={ onPropertyChange.bind( null, triggerId, 'texts' ) }
                    />
                </div>;
                break;

            case 'move':
                editor = <div>
                    <b>Target Entity Id:</b>
                    <input
                        type="text"
                        style={{ width: '40px' }}
                        value={ targetEntityId }
                        onChange={ onPropertyChange.bind( null, triggerId, 'targetEntityId' ) }
                    />

                </div>;
                break;

            default:
                editor = null;

        }

        return <div>
            <select
                onChange={ onPropertyChange.bind( null, triggerId, 'acitonType' ) }
            >
                <option value="text">Text</option>
                <option value="move">Move</option>
            </select>
            { editor }
        </div>;

    }

}
