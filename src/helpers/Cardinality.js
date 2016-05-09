import { Vector3, } from 'three';

const Cardinality = {
    NULL: new Vector3( 0, 0, 0 ),
    UP: new Vector3( 0, 0, -1 ),
    DOWN: new Vector3( 0, 0, 1 ),
    LEFT: new Vector3( -1, 0, 0 ),
    RIGHT: new Vector3( 1, 0, 0 ),
    BACK: new Vector3( 0, -1, 0 ),
    FORWARD: new Vector3( 0, 1, 0 )
};

export default Cardinality;
