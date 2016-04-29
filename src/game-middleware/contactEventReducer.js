import { Vector3, } from 'three';
import p2 from 'p2';
import {
    without, getCardinalityOfVector,
} from 'helpers/Utils';

export default function contactEventReducer(
    keysDown:Object,
    actions:Object,
    gameData:Object,
    oldState:Object,
    currentState:Object,
    next:Function
) {

    const {
        beginContactEventQueue, endContactEventQueue, playerBody,
        playerContact: oldPlayerContact,
    } = oldState;

    let playerContact = oldPlayerContact;

    for( let i = 0; i < beginContactEventQueue.length; i++ ) {

        let otherBody;
        const event = beginContactEventQueue[ i ];
        const { bodyA, bodyB, contactEquations } = event;

        // Figure out if either body equals the player, and if so, assign
        // otherBody to the other body
        if( bodyA === playerBody ) {

            otherBody = bodyB;

        } else if( bodyB === playerBody ) {

            otherBody = bodyA;

        }

        if( otherBody ) {

            // Get the contact point local to body a. There might be an easier
            // way to do this but I can't figure out how
            const { contactPointA } = contactEquations[ 0 ];

            // Convert it to world coordinates
            const contactPointWorld = [
                contactPointA[ 0 ] + bodyA.position[ 0 ],
                contactPointA[ 1 ] + bodyA.position[ 1 ]
            ];

            // Calculate the normal to the player position
            const contactToPlayerNormal = p2.vec2.normalize( [ 0, 0 ], [
                contactPointWorld[ 0 ] - playerBody.position[ 0 ],
                contactPointWorld[ 1 ] - playerBody.position[ 1 ]
            ]);

            const contactNormal = getCardinalityOfVector( new Vector3(
                contactToPlayerNormal[ 0 ],
                0,
                contactToPlayerNormal[ 1 ],
            ));

            const assign = {
                [ otherBody.id ]: contactNormal
            };

            //console.log('onPlayerColide with',otherBody.id, contactNormal);
            playerContact = { ...playerContact, ...assign };
            
        }

    }

    for( let i = 0; i < endContactEventQueue.length; i++ ) {

        let otherBody;
        const event = endContactEventQueue[ i ];
        const { bodyA, bodyB } = event;

        if( bodyA === playerBody ) {

            otherBody = bodyB;

        } else if( bodyB === playerBody ) {

            otherBody = bodyA;

        }

        if( otherBody ) {

            //console.log('ended contact with ',otherBody.id);
            playerContact = without( playerContact, otherBody.id );

        }

    }

    return next({
        ...currentState,
        playerContact,
        // flush the queues
        beginContactEventQueue: [],
        endContactEventQueue: [],
    });

}
