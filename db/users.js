var app = require("./../app");
var config = require("./../config");
var localCrypto = require("./../auth/local-crypto");

/**
 * Find a user by ID from the 'users' document
 * 
 * @param id
 * @param cb
 */
exports.findById = function(id, cb) {
    console.log(id + ' hit from within the findById function');
    app.bucket.get('users', function(err, result) {
        if (err) throw err;
        var users = result.value.users;
        for (var i = 0; i < users.length; i++){
            if (users[i].id == id){
                return cb(false, users[i]);
            }
        }
        return cb(true, null);
    });
};

/**
 * Find a user by Username from the 'users' document
 * 
 * @param key
 * @param cb
 */
exports.findByConsumerKey =  function(key, cb) {
    app.bucket.get('users', function(err, result) {
        if (err) throw err;
        var users = result.value.users;
        for (var i = 0; i < users.length; i++){
            if (users[i].username == key){
                users[i].password = localCrypto.decrypt(users[i].password);
                return cb(false, users[i]);
            }
        }
        return cb(true, null);
    });
};

/**
 * Loop through all users to find the next ID number, then create a new user object within the parent users object array
 * Takes place withing the 'users' document
 * 
 * @param user - object from /register form
 * @param cb - callback function ( error, message )
 */
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