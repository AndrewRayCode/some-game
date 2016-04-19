import THREE from 'three';
import { lerp, lerpEulers } from '../helpers/Utils';

const { randFloat } = THREE.Math;

const playerRotationLimit = 0.7 * ( Math.PI / 2 );
const turnSpeed = 0.2;
const resolveSpeed = 0.08;
const percentOpenMouth = 2.0;

const walkLoopMs = 300;

const eyeRotationLimit = {
    x: {
        min: -Math.PI / 2,
        max: Math.PI / 4
    },
    y: {
        min: 0,
        max: 0,
    },
    z: {
        min: -Math.PI / 3,
        max: Math.PI / 5
    }
};
const eyeTweenStartDelayMs = 2000;
const eyeTweenTimeMinMs = 100;
const eyeTweenTimeMaxMs = 1000;
const eyeWaitTimeMinMs = 500;
const eyeWaitTimeMaxMs = 4000;

const jumpTweenTime = 50;
const jumpReturnTweenTime = 200;

export default function playerAnimationReducer( actions, props, oldState, currentState, next ) {

    const {
        leftEyeTweenTarget, leftEyeTweenStart, leftEyeTweenDuraiton,
        leftEyeTweenRest, rightEyeTweenTarget, rightEyeTweenStart,
        rightEyeTweenDuraiton, rightEyeTweenRest, playerRotation, isLeft,
        isRight, actionStartTime, jumpStartTime
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
            weight: 1,
            percent: Math.max( 1 - turnPercent, 0 ),
        },
        Walk: {
            weight: 1,
            percent: ( timeMs % walkLoopMs ) / walkLoopMs,
        },
        Jump: {
            weight: 1,
            percent: 0,
        },

    };

    //let jumpWeight = 0;
    //let jumpAnimationPercent = 0;
    //let newJumpStartTime;

    //if( currentState.jumpedOnThisFrame ) {

        //newJumpStartTime = timeMs;

    //}

    //const eitherJumpStartTime = jumpStartTime || newJumpStartTime;
    //if( eitherJumpStartTime ) {

        //const timeSinceJumpStartMs = timeMs - eitherJumpStartTime;

        //// Initial jump animation
        //if( timeSinceJumpStartMs <= jumpTweenTime ) {

            //jumpWeight = 1;
            //jumpAnimationPercent = timeSinceJumpStartMs / jumpTweenTime;

        //// Return to whatever it was before
        //} else {

            //jumpWeight = ( timeMs - ( eitherJumpStartTime + jumpTweenTime ) ) / jumpReturnTweenTime;
            //jumpAnimationPercent = 1;

        //}

    //}

    const newState = {
        headAnimations, legAnimations,
        // todo you were here and the problem is jump animation runs differently than the others but only one time loop for each mesh. probably need different time tracks?
        //percentAlongJump: jumpAnimationPercent,
        //walkWeights: {
            //Idle: Math.max( 1 - turnPercent - jumpWeight, 0 ),
            //Walk: Math.max( turnPercent - jumpWeight, 0 ),
            //Jump: jumpWeight,
        //},
        playerRotation: new THREE.Euler(
            0,
            0,
            isLeft ? lerp( turnAngle, playerRotationLimit, turnSpeed )
                : ( isRight ?
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
