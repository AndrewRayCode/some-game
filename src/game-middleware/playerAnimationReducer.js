import THREE from 'three';
import { lerp, lerpEulers } from '../helpers/Utils';

const rotationLimit = 0.7 * ( Math.PI / 2 );
const turnSpeed = 0.2;
const resolveSpeed = 0.08;

const eyeTweenTimeMinMs = 100;
const eyeTweenTimeMaxMs = 500;
const eyeWaitTimeMinMs = 500;
const eyeWaitTimeMaxMs = 4000;
const newRotationMin = -Math.PI / 5;
const newRotationMax = Math.PI / 5;

export default function playerAnimationReducer( actions, props, oldState, currentState, next ) {

    const {
        leftEyeTweenTarget, leftEyeTweenStart, leftEyeTweenDuraiton,
        leftEyeTweenRest, rightEyeTweenTarget, rightEyeTweenStart,
        rightEyeTweenDuraiton, rightEyeTweenRest, playerRotation, isLeft,
        isRight
    } = oldState;

    const { time, } = currentState;
    const timeMs = time * 1000;

    const turnAngle = playerRotation ? playerRotation.z : 0;

    const newState = {
        percentMouthOpen: THREE.Math.clamp( Math.abs( turnAngle ), 0, 1 ),
        playerRotation: new THREE.Euler(
            0,
            0,
            isLeft ? lerp( turnAngle, rotationLimit, turnSpeed )
                : ( isRight ?
                   lerp( turnAngle, -rotationLimit, turnSpeed ) :
                   lerp( turnAngle, 0, resolveSpeed )
                ),
        )
    };

    const leftEyeTweenFinish = leftEyeTweenStart + leftEyeTweenDuraiton;
    const leftEyeFinish = leftEyeTweenStart + leftEyeTweenDuraiton + leftEyeTweenRest;

    if( !leftEyeTweenStart || timeMs > leftEyeFinish ) {

        newState.leftEyeTweenTarget = new THREE.Euler(
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
        );
        newState.leftEyeTweenStart = timeMs;
        newState.leftEyeTweenDuraiton = THREE.Math.randFloat(
            eyeTweenTimeMinMs, eyeTweenTimeMaxMs,
        );
        newState.leftEyeTweenRest =  THREE.Math.randFloat(
            eyeWaitTimeMinMs, eyeWaitTimeMaxMs,
        );

    }

    if( leftEyeTweenStart ) {

        newState.leftEyeRotation = lerpEulers(
            oldState.leftEyeRotation || new THREE.Euler( 0, 0, 0 ),
            leftEyeTweenTarget,
            Math.min(
                ( timeMs - leftEyeTweenStart ) / leftEyeTweenDuraiton,
                1
            )
        );

    }

    const rightEyeTweenFinish = rightEyeTweenStart + rightEyeTweenDuraiton;
    const rightEyeFinish = rightEyeTweenStart + rightEyeTweenDuraiton + rightEyeTweenRest;

    if( !rightEyeTweenStart || timeMs > rightEyeFinish ) {

        newState.rightEyeTweenTarget = new THREE.Euler(
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
            THREE.Math.randFloat( newRotationMin, newRotationMax ),
        );
        newState.rightEyeTweenStart = timeMs;
        newState.rightEyeTweenDuraiton = THREE.Math.randFloat(
            eyeTweenTimeMinMs, eyeTweenTimeMaxMs,
        );
        newState.rightEyeTweenRest =  THREE.Math.randFloat(
            eyeWaitTimeMinMs, eyeWaitTimeMaxMs,
        );

    }

    if( rightEyeTweenStart ) {

        newState.rightEyeRotation = lerpEulers(
            oldState.rightEyeRotation || new THREE.Euler( 0, 0, 0 ),
            rightEyeTweenTarget,
            Math.min(
                ( timeMs - rightEyeTweenStart ) / rightEyeTweenDuraiton,
                1
            )
        );

    }

    return next({
        ...currentState,
        ...newState
    });

}
