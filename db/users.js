var app = require("./../app");
var config = require("./../config");
var localCrypto = require("./../auth/local-crypto");
var couchbase = require('couchbase');

var blankUser = {
    "id": "",
    "email": "",
    "username": "",
    "password": "",
    "firstName": "",
    "lastName": "",
    "videos": [],
    "watchList": [],
    "provider": ""
};

/**
 * Find a user by ID from the all uid-xxx documents
 * 
 * @param id
 * @param cb
 */
exports.findById = function(id, cb) {
    console.log(id + ' hit from within the findById function');
    var ViewQuery = couchbase.ViewQuery;
    var query = ViewQuery.from('userId', 'userId');
    app.bucket.query(query, function(err, results) {
       for(var i in results) {
           var user = results[i].value;
           if (id == user.id){
               return cb(false, user);
           }
       }
        return cb(true, null);
    });
};

/**
 * Find a user by Username from all uid-xxx documents by username key
 * 
 * @param key
 * @param cb
 */
exports.findByConsumerKey =  function(key, cb) {
    console.log('findByConsumerKey key is '+key);
    var ViewQuery = couchbase.ViewQuery;
    var query = ViewQuery.from('userId', 'userId').key(key);
    app.bucket.query(query, function(err, results) {
        if (err) {
            // return cb(true, 'error finding match in database');
            cb(true, 'error finding match in database');
        }
        else {
            var user = results[0].value;
            user.password = localCrypto.decrypt(user.password);
            // return cb(false, user);
            return cb(false, user);
        }
    });
};

/**
 * Loop through all users to find the next ID number, then create a new user object within the parent users object array
 * Takes place withing the 'users' document
 * 
 * @param user - object from /register form
 * @param cb - callback function ( error, message )
 */
// todo - rewrite with new multi users-docs
exports.registerUser = function(user, cb) {
    app.bucket.get('users', function(err, result){
        if (err){ return cb(true, "Problem with loading the users from couchbase."); }
        var users = result.value.users;
        var ids = [];
        for (var i = 0; i < users.length; i++){
            ids.push(users[i].id);
        }
        user = JSON.parse(user);
        user.id = Math.max.apply(null, ids)+1;
        // update the incoming plaintext password to an encrypted version, this will be decrypted for oauth matches
        user.password = localCrypto.encrypt(user.password);
        users.push(user);
        users = {"users":users};
        console.log(users);
        app.bucket.upsert('users', users, function(err, result){
            if (err) { return cb(true, "Problem with saving the users to couchbase."); }
            return cb(false, "updated")
        });
    });
};

exports.getUserData = function(userId, cb) {
    app.bucket.get('uid-'+userId, function(err, result){
        console.log(result.value);
        if (err) { cb(err, result.value); }
        cb(false, result.value);
    })
};

exports.facebookUserLogin = function(profile, cb) {
    console.log(profile.id);
    app.bucket.get('uid-'+profile.id, function(err, result){
        if (err) {
            // no user found - create a new user with the default user object.
            blankUser.id = profile.id;
            blankUser.username = profile.displayName;
            blankUser.provider = profile.provider;
            app.bucket.upsert('uid-'+profile.id, blankUser, function(err){
                console.log('new facebook user created: uid-'+profile.id);
                cb(false, blankUser);
            })
        }
        else {
            cb(false, result.value);
        }
    })
};