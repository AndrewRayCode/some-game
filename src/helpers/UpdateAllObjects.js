import Module from 'react-three-renderer/lib/Module';
import KeyCodes from './KeyCodes';
import KeyHandler from 'helpers/KeyHandler';

import PropTypes from 'react/lib/ReactPropTypes';

import events from 'events';
const { EventEmitter } = events;
import { without } from './Utils';

import THREE from 'three';
const clock = new THREE.Clock();

class UpdateAllObjects extends Module {
    constructor() {
        super();

        this.onWindowBlur = this.onWindowBlur.bind( this );
        this.onKeyDown = this.onKeyDown.bind( this );
        this.onKeyUp = this.onKeyUp.bind( this );

        this._updatePropName = 'onUpdate';
        this._patchedDescriptors = [];
        this._activeCallbacks = new EventEmitter();
        this._objectsWithUpdateCallbacks = {};
    }

    update() {
        const delta = clock.getDelta();
        this._activeCallbacks.emit('update', clock.elapsedTime, delta, KeyHandler );

        // The problem is onKeyPress is repeated, but multiple frames might
        // elapse before that happens. Update all firstPress to repeat after
        // our callbacks so they will only get firstPress on one frame
        KeyHandler.updateFirstPressed();
    }

    _addUpdateCallback(threeObject, callback) {
        this._activeCallbacks.addListener('update', callback);

        threeObject.userData.events.addListener('dispose', this._objectDisposed);

        threeObject.userData._updateCallback = callback;

        this._objectsWithUpdateCallbacks[threeObject.uuid] = threeObject;
    }

    _removeUpdateCallback(threeObject) {
        this._activeCallbacks.removeListener('update', threeObject.userData._updateCallback);

        threeObject.userData.events.removeListener('dispose', this._objectDisposed);

        delete threeObject.userData._updateCallback;

        delete this._objectsWithUpdateCallbacks[threeObject.uuid];
    }

    _objectDisposed = ({ object: disposedObject }) => {
        this._removeUpdateCallback(disposedObject);
    };

    _objectUpdateCallbackChanged = (threeObject, updateCallback) => {
        if (updateCallback !== threeObject.userData._updateCallback) {
            if (!updateCallback) {
                if (!!threeObject.userData._updateCallback) {
                    this._removeUpdateCallback(threeObject);
                }
            } else {
                // new update callback wants to be set

                if (!!threeObject.userData._updateCallback) {
                    // was already set, so remove that to update cleanly
                    this._removeUpdateCallback(threeObject);
                }

                this._addUpdateCallback(threeObject, updateCallback);
            }
        }
    };

    onWindowBlur() {

        KeyHandler.reset();

    }

    onKeyDown( event ) {

        const { which: key } = event;

        const keyData = {
            [ key ]: KeyHandler.keys[ key ] || { firstPress: true }
        };

        if( key === KeyCodes.SPACE ||
                key === KeyCodes.UP ||
                key === KeyCodes.DOWN
            ) {
            event.preventDefault();
        }

        KeyHandler.keys = { ...KeyHandler.keys, ...keyData };

    }

    onKeyUp( event ) {

        KeyHandler.keys = without( KeyHandler.keys, event.which );

    }

    setup(react3RendererInstance) {
        super.setup(react3RendererInstance);
        window.addEventListener( 'blur', this.onWindowBlur );
        window.addEventListener( 'keydown', this.onKeyDown );
        window.addEventListener( 'keyup', this.onKeyUp );

        const Object3DDescriptor = react3RendererInstance.threeElementDescriptors.object3D.constructor;

        Object.values(react3RendererInstance.threeElementDescriptors).forEach(elementDescriptor => {
            if (elementDescriptor instanceof Object3DDescriptor) {
                elementDescriptor.hasProp(this._updatePropName, {
                    type: PropTypes.func,
                    updateInitial: true,
                    update: this._objectUpdateCallbackChanged,
                    default: undefined,
                });

                this._patchedDescriptors.push(elementDescriptor);
            }
        });
    }

    dispose() {
        this._patchedDescriptors.forEach(elementDescriptor => {
            elementDescriptor.removeProp(this._updatePropName);
        });

        const objectsThatStillHaveProps = Object.values(this._objectsWithUpdateCallbacks);

        if (process.env.NODE_ENV !== 'production') {
            if (objectsThatStillHaveProps.length > 0) {
                console.warn('The UpdateAllObjects module' + // eslint-disable-line no-console
                             ' has been removed; but there are objects' +
                             ' that still have the `onUpdate` property defined:', objectsThatStillHaveProps);
            }
        }

        objectsThatStillHaveProps
        .forEach(threeObject => {
            this._removeUpdateCallback(threeObject);
        });

        this._activeCallbacks.removeAllListeners();
    }
}

module.exports = UpdateAllObjects;
