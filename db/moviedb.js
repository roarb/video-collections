var config = require('./../config.json');
var couchbase = require('couchbase');
var app = require('./../app');
var http = require('http');

module.exports = {

    findByName: function (name) {

        name = encodeURI(name);
        console.log('movie name in moviedb.js ' + name);
        console.log('api_key ' + config.api.themoviedb);

        var options = {
            "host": "api.themoviedb.org",
            "path": "/3/search/multi?api_key=" + config.api.themoviedb + "&query=" + name
        };

        callback = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                var videos = JSON.parse(str);
                var videos = videos.results;
                for (var i = 0; i < videos.length; i++) {
                    var video = videos[i];
                    // save each returned video to couchbase
                    module.exports.saveVideoToCB(video, function(err, msg){
                        // call back messaging
                    });
                    // todo build a front end return here - connect through to the user profile here?
                }
            });
        };

        http.request(options, callback).end();

    },

    saveVideoToCB: function (video, cb) {
        // todo, create a call to first pull in the existing document - then update it before saving.
        console.log('video name in saveVideoToCB: '+video.title);
        app.bucket.upsert('vi-'+video.media_type+'-'+video.id, video, function(err, result){
            if (err) { return cb(true, "Problem with saving the users to couchbase."); }
            return cb(false, "updated")
        });
    }
};
