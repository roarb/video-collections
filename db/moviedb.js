var config = require('./../config.json');
var couchbase = require('couchbase');
var app = require('./../app');
var http = require('http');
var ViewQuery = couchbase.ViewQuery;

module.exports = {

    findByName: function (name, usr, cb) {

        name = encodeURI(name);

        var options = {
            "host": "api.themoviedb.org",
            "path": "/3/search/multi?api_key=" + config.api.themoviedb + "&query=" + name
        };

        // method is call outing out to themoviedb -= commenting out to test local generation from couchbase
        // callback = function (response) {
        //     var str = '';
        //     response.on('data', function (chunk) {
        //         str += chunk;
        //     });
        //     response.on('end', function () {
        //         var videos = JSON.parse(str);
        //         var videos = videos.results;
        //         for (var i = 0; i < videos.length; i++) {
        //             var video = videos[i];
        //             // save each returned video to couchbase
        //             module.exports.saveVideoToCB(video, function(err, msg){
        //                 // call back messaging
        //             });
        //             // todo build a front end return here - connect through to the user profile here?
        //             console.log(usr);
        //         }
        //
        //         return cb(false, videos);
        //     });
        // };
        //
        // http.request(options, callback).end();

        // get video results from couchbase - // todo the search functionality is quite lacking here.
        app.bucket.get('uid-'+usr.id, function(err, results){
            var owned = results.value.videos;

            var query = ViewQuery.from('video', 'movies').range(name, name+' z');
            app.bucket.query(query, function(err, results) {
                var videos = [];
                for (var i = 0; i < results.length; i++){

                    // check for a matching video ID to the user owned video IDS
                    for (var x = 0; x < owned.length; x++){
                        //console.log(results[i].id);
                        //console.log(owned[x].id);
                        if (results[i].id === owned[x].id){
                            results[i].value.owned = true;
                            results[i].value.format = owned[x].format;
                        }
                    }

                    //console.log(results[i]);
                    videos.push(results[i].value);
                }

                return cb(false, videos);
            });
        });


    },

    saveVideoToCB: function (video, cb) {
        // todo, create a call to first pull in the existing document - then update it before saving.
        var vidName = video.title;
        if (vidName == undefined){
            vidName = video.name;
        }
        console.log('saving '+vidName+' to couchbase.');
        app.bucket.upsert('vi-'+video.media_type+'-'+video.id, video, function(err, result){
            if (err) { return cb(true, "Problem with saving the users to couchbase."); }
            return cb(false, "updated")
        });
    },

    addFormat: function (userId, videoId, format, cb) {
        console.log('adding '+format+' to video '+videoId+' for user '+userId);
        app.bucket.get('uid-'+userId, function(err, result){
            if (err) { return cb(true, "Problem Accessing User Video Collection" ); }
            // check if the incoming videoId matches any of the users current videos
            var added = false;
            for (var i = 0; i < result.value.videos.length; i++){
                console.log(added);
                console.log(videoId);
                console.log(result.value.videos[i].id);
                if (videoId === result.value.videos[i].id && !added){
                    console.log('matching video found');
                    console.log(format+' added to '+videoId);
                    // match found - add in the format record // shouldn't already exist based off app logic
                    // todo perhaps add some error checking just in case especially for spammed requests.
                    result.value.videos[i].format.push(format);
                    added = true;
                }
            }
            if (!added) {
                if (result.value.videos == undefined){
                    result.value.videos = [];
                }
                result.value.videos.push({"id": videoId, "format": [format]});
                added = true;
            }
            app.bucket.upsert('uid-'+userId, result.value, function(err){
                if (err){ cb (true, 'Couchbase save function error'); }
            });
            cb (false, 'Movie Format Added');
        });

    },

    removeFormat: function(userId, videoId, format, cb) {
        app.bucket.get('uid-'+userId, function(err, result) {
            if (err) {
                return cb(true, "Problem Accessing User Video Collection");
            }
            console.log(result.value);
            for (var i = 0; i < result.value.videos.length; i++){
                if (videoId === result.value.videos[i].id){
                    var index = result.value.videos[i].format.indexOf(format);
                    if (index > -1){
                        result.value.videos[i].format.splice(index, 1);
                    }
                }
            }
            app.bucket.upsert('uid-'+userId, result.value, function(err){
                if (err){ cb (true, 'Couchbase save function error'); }
            });
            cb (false, 'Movie Format Removed');
        });
    }
};
