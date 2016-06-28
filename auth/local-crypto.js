var crypto = require('crypto');
var config = require('../config');

/**
 * encrypt a string
 * 
 * @param text
 * @returns {*|Hasher}
 */
exports.encrypt = function(text){

    var cipher = crypto.createCipher(config.crypt.algorithm,config.crypt.key);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    console.log(crypted);
    return crypted;

};

/**
 * decrypt a string
 * 
 * @param text
 * @returns {*|Hasher}
 */
exports.decrypt = function(text){
    var decipher = crypto.createDecipher(config.crypt.algorithm,config.crypt.key);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    console.log(dec);
    return dec;
};