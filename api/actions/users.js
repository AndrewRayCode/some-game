import db from '../../src/db';

export function submitSplashEmail( request ) {

    return new Promise( ( resolve, reject ) => {

        const { email } = request.body;

        return db( 'users' )
            .select( 'id' )
            .where({ email })
            .then( existingUsers => {

                if( existingUsers.length > 0 ) {
                    return reject({
                        error: 'This email already registered!'
                    });
                }

                return db
                    .insert({ email, created_at: new Date() })
                    .into( 'users' )
                    .then( insertedLevelIds => resolve({
                        success: true,
                    }) );

            }).catch( error => {
                console.error( error );
                reject( error );
            });
        
    });

}

