import KeyCodes from './KeyCodes';

export default {
    keys: {},
    reset() {
        this.keys = {};
    },
    getKey( code:number ):any {
        return this.keys[ code ];
    },
    isRepeated( keyCode:number ):bool {
        const keyTest = this.getKey( keyCode );
        return !!( keyTest && keyTest.repeat );
    },
    isFirstPress( keyCode:number ):bool {
        const keyTest = this.getKey( keyCode );
        return !!( keyTest && keyTest.firstPress );
    },
    isPressed( keyCode:number ):bool {
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
