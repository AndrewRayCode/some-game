import React, { PropTypes, Component } from 'react';
import React3 from 'react-three-renderer';
import {
    ArrayEditor
} from 'components';
import * as Cardinality from 'helpers/Cardinality';
import THREE from 'three';
import * as easingTypes from 'easing-utils';

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

        const {
            actionType, texts, targetEntityId, moveScale, direction, easing,
            duration,
        } = trigger;

        let editor;

        switch( actionType ) {

            case 'text':
                editor = <div>
                    <b>Texts</b>
                    <br />
                    <ArrayEditor
                        value={ texts || [] }
                        onChange={ onPropertyChange.bind( null, triggerId, 'texts' ) }
                    />
                </div>;
                break;

            case 'move':
                editor = <div>
                    <b>Target Entity Id</b>
                    <br />
                    <input
                        type="text"
                        style={{ width: '60px' }}
                        value={ targetEntityId }
                        onChange={ onPropertyChange.bind( null, triggerId, 'targetEntityId' ) }
                    />

                    <br />
                    <b>Direction</b>
                    <br />
                    <select
                        onChange={ onPropertyChange.bind( null, triggerId, 'direction' ) }
                    >
                    { Object.keys( Cardinality )
                        .filter( key => key !== 'NULL' && key !== 'default' )
                        .map( key => <option
                                value={ key }
                                selected={ key === direction }
                            >{ key }</option> )
                    }
                    </select>

                    <br />
                    <b>Move % of object scale</b>
                    <br />
                    <input
                        type="text"
                        style={{ width: '60px' }}
                        value={ moveScale }
                        onChange={ onPropertyChange.bind( null, triggerId, 'moveScale' ) }
                    />

                    <br />
                    <b>Duration (ms)</b>
                    <br />
                    <input
                        type="text"
                        style={{ width: '60px' }}
                        value={ duration }
                        onChange={ onPropertyChange.bind( null, triggerId, 'duration' ) }
                    />

                    <br />
                    <b>Easing</b>
                    <br />
                    <select
                        onChange={ onPropertyChange.bind( null, triggerId, 'easing' ) }
                    >
                    { Object.keys( easingTypes )
                        .filter( key => key !== 'default' )
                        .map( key => <option
                                value={ key }
                                selected={ key === easing }
                            >{ key }</option> )
                    }
                    </select>
                </div>;
                break;

            default:
                editor = <div>Unknown type!</div>;

        }

        return <div>
            <b>Action Type</b>
            <br />
            <select
                onChange={ onPropertyChange.bind( null, triggerId, 'actionType' ) }
            >
                <option value="text">Text</option>
                <option value="move">Move</option>
            </select>
            { editor }
        </div>;

    }

}
