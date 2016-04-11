import THREE from 'three';
import { lerp } from '../helpers/Utils';

const rotationLimit = 0.7 * ( Math.PI / 2 );
const turnSpeed = 0.2;
const resolveSpeed = 0.08;

export default function playerRotationReducer( actions, props, oldState, currentState, next ) {

    const { playerRotation, isLeft, isRight } = oldState;

    const turnAngle = playerRotation ? playerRotation.z : 0;

    const newState = {
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

    return next({
        ...currentState,
        ...newState
    });

}
