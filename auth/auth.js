/**
 * Passport uses what are termed strategies to authenticate requests. Strategies range from verifying a username and password,
 * delegated authentication using OAuth or federated authentication using OpenID.
 *
 * Before asking Passport to authenticate a request, the strategy (or strategies) used by an application must be configured.
 *
 * Strategies, and their configuration, are supplied via the use() function. For example, the following uses the
 * LocalStrategy for username/password authentication.
 *
 * @type {Passport}
 */

var passport = require('passport');
var ConsumerStrategy = require('passport-http-oauth').ConsumerStrategy;
var TokenStrategy = require('passport-http-oauth').TokenStrategy;
var FacebookStrategy = require('passport-facebook');
var db = require('./../db');
var config = require('../config.json');

/**
 * Parameters
 *
 * By default, LocalStrategy expects to find credentials in parameters named username and password.
 * If your site prefers to name these fields differently, options are available to change the defaults.
 *
 * passport.use(new LocalStrategy({
 *    usernameField: 'email',
 *    passwordField: 'passwd'
 * },
 * function(username, password, done) {
 *   // ...
 * }
 * ));
 */

/**
 * Verify Callback
 *
 * This example introduces an important concept. Strategies require what is known as a verify callback.
 * The purpose of a verify callback is to find the user that possesses a set of credentials.
 *
 * When Passport authenticates a request, it parses the credentials contained in the request. It then invokes the verify
 * callback with those credentials as arguments, in this case username and password. If the credentials are valid,
 * the verify callback invokes done to supply Passport with the user that authenticated.
 *
 * return done(null, user);
 *
 * If the credentials are not valid (for example, if the password is incorrect), done should be invoked with false
 * instead of a user to indicate an authentication failure.
 *
 * return done(null, false);
 *
 * An additional info message can be supplied to indicate the reason for the failure. This is useful for
 * displaying a flash message prompting the user to try again.
 *
 * return done(null, false, { message: 'Incorrect password.' });
 *
 * Finally, if an exception occurred while verifying the credentials (for example, if the database is not available),
 * done should be invoked with an error, in conventional Node style.
 *
 * return done(err);
 *
 * Note that it is important to distinguish the two failure cases that can occur. The latter is a server exception,
 * in which err is set to a non-null value. Authentication failures are natural conditions, in which the server is
 * operating normally. Ensure that err remains null, and use the final argument to pass additional details.
 *
 * By delegating in this manner, the verify callback keeps Passport database agnostic. Applications are free
 * to choose how user information is stored, without any assumptions imposed by the authentication layer.
 *
 **/

/**
 * FacebookStrategy
 *
 * testing integration from documentation at https://github.com/jaredhanson/passport-facebook
 *
 */
passport.use('facebook', new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id','name','displayName','friends','picture{url}', 'email']
},

    function(accessToken, refreshToken, profile, cb){

        console.log(profile);

        db.users.facebookUserLogin(profile, accessToken, function(err, user){

            return cb(false, user);
        });

    }
));


/**
 * ConsumerStrategy
 *
 * This strategy is used to authenticate registered OAuth consumers (aka
 * clients).  It is employed to protect the `request_tokens` and `access_token`
 * endpoints, which consumers use to request temporary request tokens and access
 * tokens.
 */
passport.use('consumer', new ConsumerStrategy(
    // consumer callback
    //
    // This callback finds the registered client associated with `consumerKey`.
    // The client should be supplied to the `cb` callback as the second
    // argument, and the consumer secret known by the server should be supplied
    // as the third argument.  The `ConsumerStrategy` will use this secret to
    // validate the request signature, failing authentication if it does not
    // match.
    function(consumerKey, cb) {
        console.log('incoming consumerKey: '+consumerKey);
        db.users.findByConsumerKey(consumerKey, function(err, client){
            console.log('from passport - consumer auth - client = ');
            // console.log(client);
            // if (err) {
            //     console.log("err found in findByConsumerKey");
            //     return cb(err);
            // }
            // else if (!client) {
            //     console.log("no client found in findByConsumerKey");
            //     return cb(false, "no client found in findByConsumerKey");
            // }
            // else {
            //     console.log("should be positive return for findByConsumerKey with null, client, client.password");
            //     console.log(client);
            //     console.log(client.password);
            //     cb(false, client, client.password);
            // }
            cb(false, client, client.password);
        });
        // db.clients.findByConsumerKey(consumerKey, function(err, client) {
        //     if (err) { return done(err); }
        //     if (!client) { return done(null, false); }
        //     return done(null, client, client.consumerSecret);
        // });
    },
    // token callback
    //
    // This callback finds the request token identified by `requestToken`.  This
    // is typically only invoked when a client is exchanging a request token for
    // an access token.  The `done` callback accepts the corresponding token
    // secret as the second argument.  The `ConsumerStrategy` will use this secret to
    // validate the request signature, failing authentication if it does not
    // match.
    //
    // Furthermore, additional arbitrary `info` can be passed as the third
    // argument to the callback.  A request token will often have associated
    // details such as the user who approved it, scope of access, etc.  These
    // details can be retrieved from the database during this step.  They will
    // then be made available by Passport at `req.authInfo` and carried through to
    // other middleware and request handlers, avoiding the need to do additional
    // unnecessary queries to the database.
    function(requestToken, done) {
        console.log('request token first');
        console.log(requestToken);
        db.requestTokens.find(requestToken, function(err, token) {
            if (err) { return done(err); }

            var info = { verifier: token.verifier,
                clientID: token.clientID,
                userID: token.userID,
                approved: token.approved
            };
            done(false, token.secret, info);
        });
    },
    // validate callback
    //
    // The application can check timestamps and nonces, as a precaution against
    // replay attacks.  In this example, no checking is done and everything is
    // accepted.
    function(timestamp, nonce, done) {
        done(false, true)
    }
));

/**
 * TokenStrategy
 *
 * This strategy is used to authenticate users based on an access token.  The
 * user must have previously authorized a client application, which is issued an
 * access token to make requests on behalf of the authorizing user.
 */
//
// passport.use('token', new TokenStrategy(
//     // consumer callback
//     //
//     // This callback finds the registered client associated with `consumerKey`.
//     // The client should be supplied to the `done` callback as the second
//     // argument, and the consumer secret known by the server should be supplied
//     // as the third argument.  The `TokenStrategy` will use this secret to
//     // validate the request signature, failing authentication if it does not
//     // match.
//     function(consumerKey, done) {
//         console.log('token requested');
//         db.clients.findByConsumerKey(consumerKey, function(err, client) {
//             if (err) { return done(err); }
//             if (!client) { return done(null, false); }
//             return done(null, client, client.consumerSecret);
//         });
//     },
//     // verify callback
//     //
//     // This callback finds the user associated with `accessToken`.  The user
//     // should be supplied to the `done` callback as the second argument, and the
//     // token secret known by the server should be supplied as the third argument.
//     // The `TokenStrategy` will use this secret to validate the request signature,
//     // failing authentication if it does not match.
//     //
//     // Furthermore, additional arbitrary `info` can be passed as the fourth
//     // argument to the callback.  An access token will often have associated
//     // details such as scope of access, expiration date, etc.  These details can
//     // be retrieved from the database during this step.  They will then be made
//     // available by Passport at `req.authInfo` and carried through to other
//     // middleware and request handlers, avoiding the need to do additional
//     // unnecessary queries to the database.
//     //
//     // Note that additional access control (such as scope of access), is an
//     // authorization step that is distinct and separate from authentication.
//     // It is an application's responsibility to enforce access control as
//     // necessary.
//     function(accessToken, done) {
//         db.accessTokens.find(accessToken, function(err, token) {
//             if (err) { return done(err); }
//             db.users.find(token.userID, function(err, user) {
//                 if (err) { return done(err); }
//                 if (!user) { return done(null, false); }
//                 // to keep this example simple, restricted scopes are not implemented
//                 var info = { scope: '*' };
//                 done(null, user, token.secret, info);
//             });
//         });
//     },
//     // validate callback
//     //
//     // The application can check timestamps and nonces, as a precaution against
//     // replay attacks.  In this example, no checking is done and everything is
//     // accepted.
//     function(timestamp, nonce, done) {
//         done(null, true)
//     }
// ));