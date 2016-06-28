var uuid = require("node-uuid");
var db = require("../app").bucket;
var config = require("../config");
var couchbase = require("couchbase");
var ViewQuery = couchbase.ViewQuery;

function RecordModel() { }

/*
 * Delete a document from Couchbase Server by document id
 */
RecordModel.delete = function(documentId, callback) {
    db.remove(documentId, function(error, result) {
        if(error) {
            callback(error, null);
            return;
        }
        callback(null, {message: "success", data: result});
    });
};

/*
 * Save a document.  If a document id is not provided an insert will happen, otherwise update.  Thus an upsert.
 */
RecordModel.save = function(data, callback) {
    var jsonObject = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email
    };
    // If the document id doesn't exist create a unique id for inserting
    var documentId = data.document_id ? data.document_id : 'usr-'+uuid.v4();
    db.upsert(documentId, jsonObject, function(error, result) {
        if(error) {
            callback(error, null);
            return;
        }
        callback(null, {message: "success", data: result});
    });
};

/*
 * Get a particular document from Couchbase Server by document id
 */
RecordModel.getByDocumentId = function(documentId, callback) {

    db.get(documentId, function(err, result){
        if (err) throw err;
        callback(null, result.value);
    });
};

/*
 * Get all documents from Couchbase Server using View usr
 */
RecordModel.getAllUsr = function(callback) {

    var query = ViewQuery.from('usr','usr'); // example is showing ViewQuery.from('_design/"usr"', 'view: "usr"')
    db.query(query, function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
};

module.exports = RecordModel;
