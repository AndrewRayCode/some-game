import THREE from 'three';

const Cardinality = {
    NULL: new THREE.Vector3( 0, 0, 0 ),
    UP: new THREE.Vector3( 0, 0, -1 ),
    DOWN: new THREE.Vector3( 0, 0, 1 ),
    LEFT: new THREE.Vector3( -1, 0, 0 ),
    RIGHT: new THREE.Vector3( 1, 0, 0 ),
    BACK: new THREE.Vector3( 0, -1, 0 ),
    FORWARD: new THREE.Vector3( 0, 1, 0 )
};

export default Cardinality;
