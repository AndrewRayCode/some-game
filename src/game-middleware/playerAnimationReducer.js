import THREE from 'three';
import { lerp, lerpEulers } from '../helpers/Utils';

const { randFloat } = THREE.Math;

const playerRotationLimit = 0.7 * ( Math.PI / 2 );
const turnSpeed = 0.2;
const resolveSpeed = 0.08;
const percentOpenMouth = 1.0;

const walkLoopMs = 300;

const eyeRotationLimit = {
    x: {
        min: -Math.PI / 3,
        max: Math.PI / 5
    },
    y: {
        min: 0,
        max: 0,
    },
    z: {
        min: -Math.PI / 4,
        max: Math.PI / 5
    }
};
const eyeTweenStartDelayMs = 2000;
const eyeTweenTimeMinMs = 100;
const eyeTweenTimeMaxMs = 1000;
const eyeWaitTimeMinMs = 500;
const eyeWaitTimeMaxMs = 4000;

const jumpTweenTimeMs = 30;
const jumpReturnTweenTimeMs = 500;

export default function playerAnimationReducer( actions, props, oldState, currentState, next ) {

    const {
        leftEyeTweenTarget, leftEyeTweenStart, leftEyeTweenDuraiton,
        leftEyeTweenRest, rightEyeTweenTarget, rightEyeTweenStart,
        rightEyeTweenDuraiton, rightEyeTweenRest, playerRotation, isLeft,
        isRight, actionStartTime, jumpStartTime: oldJumpStartTime
    } = oldState;

    const { time, } = currentState;
    const timeMs = time * 1000;

    const turnAngle = playerRotation ? playerRotation.z : 0;
    const turnPercent = Math.abs( turnAngle ) / playerRotationLimit;

    const headAnimations = {
        'Open Mouth': {
            weight: 1,
            percent: turnPercent * percentOpenMouth,
        },
    };
    const legAnimations = {
        Idle: {
            weight: 0,
            percent: 0,
        },
        Walk: {
            weight: 0,
            percent: ( timeMs % walkLoopMs ) / walkLoopMs,
        },
        Jump: {
            weight: 0,
            percent: 0,
        },
    };

    let jumpWeight = 0;
    let jumpAnimationPercent = 0;
    let jumpStartTime = oldJumpStartTime;
    let jumpedOnThisFrame;

    // Did we jump on this frame?
    if( currentState.jumpedOnThisFrame ) {

        jumpStartTime = timeMs;

    }

    if( jumpStartTime ) {

        // Calculate how much time has passed since the first jump frame
        const timeSinceJumpStartMs = timeMs - jumpStartTime;

        // Initial jump animation
        if( timeSinceJumpStartMs <= jumpTweenTimeMs ) {

            jumpWeight = 1;
            jumpAnimationPercent = timeSinceJumpStartMs / jumpTweenTimeMs;

        // Slowly return to whatever it was before
        } else {

            jumpWeight = 1 - ( timeMs - ( jumpStartTime + jumpTweenTimeMs ) ) / jumpReturnTweenTimeMs;
            jumpAnimationPercent = 1;

            if( jumpWeight < 0 ) {
                jumpWeight = 0;
                jumpStartTime = null;
                jumpedOnThisFrame = null;
            }

        }
        console.log( 'jumpAnimationPercent:', jumpAnimationPercent );

    }

    legAnimations.Idle.weight = Math.max( 1 - turnPercent - jumpWeight, 0 );
    legAnimations.Walk.weight = Math.max( turnPercent - jumpWeight, 0 );
    legAnimations.Jump.weight = jumpWeight;
    legAnimations.Jump.percent = jumpAnimationPercent;

    const newState = {
        headAnimations, legAnimations, jumpStartTime,
        playerRotation: new THREE.Euler(
            0,
            0,
            isLeft ?
                lerp( turnAngle, playerRotationLimit, turnSpeed ) :
                ( isRight ?
                   lerp( turnAngle, -playerRotationLimit, turnSpeed ) :
                   lerp( turnAngle, 0, resolveSpeed )
                ),
        )
    };

    if( !actionStartTime ) {

        newState.actionStartTime = timeMs;

    }

    if( !actionStartTime || ( timeMs - actionStartTime ) < eyeTweenStartDelayMs ) {
        return next({
            ...currentState,
            ...newState
        });
    }

    const leftEyeFinish = leftEyeTweenStart + leftEyeTweenDuraiton + leftEyeTweenRest;

    if( !leftEyeTweenStart || timeMs > leftEyeFinish ) {

        newState.leftEyeTweenTarget = new THREE.Euler(
            randFloat( eyeRotationLimit.x.min, eyeRotationLimit.x.max ),
            randFloat( eyeRotationLimit.y.min, eyeRotationLimit.y.max ),
            randFloat( -eyeRotationLimit.z.min, -eyeRotationLimit.z.max ),
        );
        newState.leftEyeTweenStart = timeMs;
        newState.leftEyeTweenDuraiton = randFloat(
            eyeTweenTimeMinMs, eyeTweenTimeMaxMs,
        );
        newState.leftEyeTweenRest = randFloat(
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

    const rightEyeFinish = rightEyeTweenStart + rightEyeTweenDuraiton + rightEyeTweenRest;

    if( !rightEyeTweenStart || timeMs > rightEyeFinish ) {

        newState.rightEyeTweenTarget = new THREE.Euler(
            randFloat( eyeRotationLimit.x.min, eyeRotationLimit.x.max ),
            randFloat( eyeRotationLimit.y.min, eyeRotationLimit.y.max ),
            randFloat( eyeRotationLimit.z.min, eyeRotationLimit.z.max ),
        );
        newState.rightEyeTweenStart = timeMs;
        newState.rightEyeTweenDuraiton = randFloat(
            eyeTweenTimeMinMs, eyeTweenTimeMaxMs,
        );
        newState.rightEyeTweenRest = randFloat(
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
