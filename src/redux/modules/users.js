const SPLASH_LOADING = 'assets/SPLASH_LOADING';
const SPLASH_SUCCESS = 'assets/SPLASH_SUCCESS';
const SPLASH_FAIL = 'assets/SPLASH_FAIL';

export function splashSubmitReducer( state = {}, action = {} ) {

    switch( action.type ) {

        case SPLASH_LOADING:
            return { loading: true };

        case SPLASH_SUCCESS:
            return { success: true };

        case SPLASH_FAIL:
            return { failure: action.error ?
                action.error.error :
                'Unknown error!'
            };

        default:
            return state;

    }

}

export function splashLoading() {

    return { type: SPLASH_LOADING, };

}

export function submitSplashEmail( email ) {

    return {
        types: [ SPLASH_LOADING, SPLASH_SUCCESS, SPLASH_FAIL ],
        promise: client => client.post( '/submitSplashEmail', { data: { email } } )
    };

}
