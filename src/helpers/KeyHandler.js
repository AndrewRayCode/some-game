import KeyCodes from './KeyCodes';

export default {
    keys: {},
    reset() {
        this.keys = {};
    },
    getKey( code ) {
        return this.keys[ KeyCodes[ code ] ];
    },
    isRepeated( keyCode ) {
        const keyTest = this.getKey( keyCode );
        return keyTest && keyTest.repeat;
    },
    isFirstPress( keyCode ) {
        const keyTest = this.getKey( keyCode );
        return keyTest && keyTest.firstPress;
    },
    isPressed( keyCode ) {
        return !!this.getKey( keyCode );
    },
    updateFirstPressed() {
        for( const key in this.keys ) {
            const keyData = this.keys[ key ];
            if( keyData.firstPress ) {
                this.keys[ key ] = { repeat: true };
            }
        }
    }
};
