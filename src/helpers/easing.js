// based on https://gist.github.com/gre/1650294

// no easing, no acceleration
export function linear( t ) {
    return t;
}

// accelerating from zero velocity
export function easeInQuad( t ) {
    return t * t;
}

// decelerating to zero velocity
export function easeOutQuad( t ) {
    return t * ( 2 - t );
}

// acceleration until halfway, then deceleration
export function easeInOutQuad( t ) {
    return t < 0.5 ? 2 * t * t : - 1 + ( 4 - 2 * t ) * t;
}

// accelerating from zero velocity
export function easeInCubic( t ) {
    return t * t * t;
}

// decelerating to zero velocity
export function easeOutCubic( t ) {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
}

// acceleration until halfway, then deceleration
export function easeInOutCubic( t ) {
    return t < 0.5 ? 4 * t * t * t : ( t - 1 ) * ( 2 * t - 2 ) * ( 2 * t - 2 ) + 1;
}

// accelerating from zero velocity
export function easeInQuart( t ) {
    return t * t * t * t;
}

// decelerating to zero velocity
export function easeOutQuart( t ) {
    const t1 = t - 1;
    return 1 - t1 * t1 * t1 * t1;
}

// acceleration until halfway, then deceleration
export function easeInOutQuart( t ) {
    const t1 = t - 1;
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * t1 * t1 * t1 * t1;
}

// accelerating from zero velocity
export function easeInQuint( t ) {
    return t * t * t * t * t;
}

// decelerating to zero velocity
export function easeOutQuint( t ) {
    const t1 = t - 1;
    return 1 + t1 * t1 * t1 * t1 * t1;
}

// acceleration until halfway, then deceleration
export function easeInOutQuint( t ) {
    const t1 = t - 1;
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * t1 * t1 * t1 * t1 * t1;
}
