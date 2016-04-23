import THREE from 'three';
import { lerp, lerpEulers, frac } from '../helpers/Utils';

const { randFloat } = THREE.Math;

const playerRotationLimit = 0.7 * ( Math.PI / 2 );
const turnSpeed = 0.2;
const resolveSpeed = 0.08;
const maxPercentMouthOpen = 0.5;

const walkLoopMs = 400;

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
const eyeTweenTimeMaxMs = 2000;
const eyeWaitTimeMinMs = 500;
const eyeWaitTimeMaxMs = 4000;

const lidFollowPercent = 0.5;

const maxJumpPercent = 0.6;
const jumpTweenTimeMs = 40;
const jumpReturnTweenTimeMs = 500;

const minBlinkInterval = 1000;
const blinkDurationMs = 300;
const timeAfterBlinkToResetMs = 1500;

const tailIdleTimeMs = 2000;

export default function playerAnimationReducer( actions, props, oldState, currentState, next ) {

    const {
        leftEyeTweenTarget, leftEyeTweenStart, leftEyeTweenDuraiton,
        leftEyeTweenRest, rightEyeTweenTarget, rightEyeTweenStart,
        rightEyeTweenDuraiton, rightEyeTweenRest, playerRotation, isLeft,
        isRight, actionStartTime, jumpStartTime: oldJumpStartTime,
        blinkStartTime: oldBlinkStartTime
    } = oldState;

    const { time, } = currentState;
    const timeMs = time * 1000;

    const turnAngle = playerRotation ? playerRotation.z : 0;
    const turnPercent = Math.abs( turnAngle ) / playerRotationLimit;

    const headAnimations = {
        'Open Mouth': {
            weight: 1,
            percent: turnPercent * maxPercentMouthOpen,
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
    const tailAnimations = {
        Idle: {
            weight: 1,
            percent: ( timeMs % tailIdleTimeMs ) / tailIdleTimeMs
        }
    };

    let blinkStartTime = oldBlinkStartTime;
    let jumpWeight = 0;
    let jumpAnimationPercent = 0;
    let jumpStartTime = oldJumpStartTime;
    let jumpedOnThisFrame;

    // Did we jump on this frame?
    if( currentState.jumpedOnThisFrame ) {

        jumpStartTime = timeMs;

    }

    if( jumpStartTime ) {

        blinkStartTime = timeMs;

        // Calculate how much time has passed since the first jump frame
        const timeSinceJumpStartMs = timeMs - jumpStartTime;

        // Initial jump animation
        if( timeSinceJumpStartMs <= jumpTweenTimeMs ) {

            jumpWeight = 1;
            jumpAnimationPercent = maxJumpPercent * ( timeSinceJumpStartMs / jumpTweenTimeMs );

        // Slowly return to whatever it was before
        } else {

            jumpWeight = 1 - ( timeMs - ( jumpStartTime + jumpTweenTimeMs ) ) / jumpReturnTweenTimeMs;
            jumpAnimationPercent = maxJumpPercent;

            if( jumpWeight < 0 ) {
                jumpWeight = 0;
                jumpStartTime = null;
                jumpedOnThisFrame = null;
            }

        }

    }

    legAnimations.Idle.weight = Math.max( 1 - turnPercent - jumpWeight, 0 );
    legAnimations.Walk.weight = Math.max( turnPercent - jumpWeight, 0 );
    legAnimations.Jump.weight = jumpWeight;
    legAnimations.Jump.percent = jumpAnimationPercent;

    const newState = {
        tailAnimations, headAnimations, legAnimations, jumpStartTime,
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

        const eyeTweenPercent = Math.min(
            ( timeMs - leftEyeTweenStart ) / leftEyeTweenDuraiton,
            1
        );

        newState.leftEyeRotation = lerpEulers(
            oldState.leftEyeRotation || new THREE.Euler( 0, 0, 0 ),
            leftEyeTweenTarget,
            eyeTweenPercent,
        );

        newState.leftLidRotation = lerpEulers(
            oldState.leftLidRotation || new THREE.Euler( 0, 0, 0 ),
            new THREE.Euler().setFromVector3(
                leftEyeTweenTarget.toVector3().multiplyScalar( lidFollowPercent )
            ),
            eyeTweenPercent,
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

        const eyeTweenPercent = Math.min(
            ( timeMs - rightEyeTweenStart ) / rightEyeTweenDuraiton,
            1
        );

        newState.rightEyeRotation = lerpEulers(
            oldState.rightEyeRotation || new THREE.Euler( 0, 0, 0 ),
            rightEyeTweenTarget,
            eyeTweenPercent,
        );

        newState.rightLidRotation = lerpEulers(
            oldState.rightLidRotation || new THREE.Euler( 0, 0, 0 ),
            new THREE.Euler().setFromVector3(
                rightEyeTweenTarget.toVector3().multiplyScalar( lidFollowPercent )
            ),
            eyeTweenPercent,
        );

    }

    if( !blinkStartTime && (
            ( !oldState.isLeft && currentState.isLeft ) ||
            ( !oldState.isRight && currentState.isRight )
        ) ) {

        blinkStartTime = timeMs;

    }

    if( blinkStartTime && ( ( timeMs - oldState.lastBlinkTime || 0 ) > minBlinkInterval ) ) {

        if( !oldBlinkStartTime ) {

            newState.lastBlinkTime = timeMs;

        }

        newState.blinkStartTime = blinkStartTime;

        const blinkPercent = ( timeMs - blinkStartTime ) / blinkDurationMs;

        const upperCloseHalfMorph = 2 * Math.abs( 0.5 - frac( 2 * blinkPercent + 0.5 ) );
        const upperCloseFullMorph = 2 * Math.abs( 0.5 - frac( blinkPercent + 0.5 ) );
        newState.eyeMorphTargets = [ upperCloseHalfMorph, upperCloseFullMorph, upperCloseHalfMorph, upperCloseFullMorph ];

        newState.rightLidRotation = lerpEulers(
            oldState.rightLidRotation,
            new THREE.Euler( 0, 0, 0 ),
            blinkPercent,
        );

        newState.leftLidRotation = lerpEulers(
            oldState.leftLidRotation,
            new THREE.Euler( 0, 0, 0 ),
            blinkPercent,
        );

        if( blinkPercent >= 0.5 ) {
            newState.leftEyeRotation = lerpEulers(
                oldState.leftEyeRotation,
                new THREE.Euler( 0, 0, 0 ),
                blinkPercent,
            );
            newState.leftEyeTweenStart = timeMs;
            newState.leftEyeTweenDuration = 0;
            newState.leftEyeTweenTarget = new THREE.Euler( 0, 0, 0 );
            newState.leftEyeTweenRest = timeAfterBlinkToResetMs;

            newState.rightEyeRotation = lerpEulers(
                oldState.leftEyeRotation,
                new THREE.Euler( 0, 0, 0 ),
                blinkPercent,
            );
            newState.rightEyeTweenTarget = new THREE.Euler( 0, 0, 0 );
            newState.rightEyeTweenStart = timeMs;
            newState.rightEyeTweenDuration = 0;
            newState.rightEyeTweenRest = timeAfterBlinkToResetMs;
        }

        if( blinkPercent >= 1 ) {
            newState.eyeMorphTargets = [ 0, 0, 0, 0 ];
            newState.blinkStartTime = null;
        }

    }

    return next({
        ...currentState,
        ...newState
    });

}
