var config = require('./../config.json');
var couchbase = require('couchbase');
var app = require('./../app');
var http = require('http');
var ViewQuery = couchbase.ViewQuery;
var Q = require("q");

module.exports = {

    findByName: function (name, usr, cb) {

        name = encodeURI(name);

        var options = {
            "host": "api.themoviedb.org",
            "path": "/3/search/multi?api_key=" + config.api.themoviedb + "&query=" + name
        };

        // method is call outing out to themoviedb -= comment out to test local generation from couchbase
        callback = function (response) {
            var str = '';
            var parent = this;
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                var videos = JSON.parse(str);
                videos = videos.results;

                app.bucket.get('uid-'+usr.id, function(err, results) {
                    if (err) { return cb(true, err); }
                    var owned = results.value.videos;
                    var watchList = results.value.watchList;

                    var compileVideos = function(videos) {
                        var rootDeferred = Q.defer();

                        var getSeasons = function () {
                            var deferred = Q.defer();
                            var seasonUpdates = [];

                            for (var i = 0; i < videos.length; i++) {

                                for (var x = 0; x < owned.length; x++) {
                                    if (owned[x].id === 'vi-' + videos[i].media_type + '-' + videos[i].id) {
                                        videos[i].format = owned[x].format;
                                        videos[i].userRating = owned[x].rating;
                                        if (owned[x].length > -1) {
                                            videos[i].owned = true;
                                        }
                                    }
                                    videos[i].videoId = 'vi-' + videos[i].media_type + '-' + videos[i].id;
                                }
                                for (var x = 0; x < watchList.length; x++) {
                                    if ('vi-' + videos[i].media_type + '-' + videos[i].id == watchList[x]) {
                                        videos[i].watchList = true;
                                    }
                                }

                                if (videos[i].media_type == 'tv') {

                                    findTelevisionSeason(videos[i].id, usr, function (err, result) {
                                        result = JSON.parse(result);
                                        seasonUpdates.push(result);
                                        deferred.resolve(seasonUpdates);
                                    });
                                } else {
                                    seasonUpdates.push([{"movieId":videos[i].id}]);
                                    deferred.resolve(seasonUpdates);
                                }

                            }

                            return deferred.promise;
                        };

                        function seasonsReady(seasonUpdates, vidLen){

                            setTimeout(function(){
                                if (vidLen == seasonUpdates.length){
                                    rootDeferred.resolve(seasonUpdates);
                                } else {
                                    seasonsReady(seasonUpdates, vidLen);
                                }
                            }, 100);
                        }

                        getSeasons()
                            .then(function(seasonUpdates) {
                                seasonsReady(seasonUpdates, videos.length);
                            });

                        return rootDeferred.promise;
                    };

                    compileVideos(videos)
                        .then(function(seasonUpdates) {

                            for (var v = 0; v < videos.length; v++){
                                for (var s = 0; s < seasonUpdates.length; s++){
                                    if (videos[v].id == seasonUpdates[s].id){
                                        videos[v].tvDetails = seasonUpdates[s];
                                    }
                                }
                                 module.exports.saveVideoToCB(videos[v], function (err, msg) {
                                    // console.log('write to cb -msg - ' + msg);
                                 });
                            }

                            return cb(false, videos);
                        });

                });
            });
        };

        http.request(options, callback).end();

    },

    findMovieDetailed: function(id, usr, cb){
        console.log('get the details for the movie id '+id);

        var options = {
            "host": "api.themoviedb.org",
            "path": "/3/movie/"+id+"?api_key=" + config.api.themoviedb
        };

        var credits = {
            "host": "api.themoviedb.org",
            "path": "/3/movie/"+id+"/credits?api_key="+config.api.themoviedb
        };
        var movie = "temp";

        callback = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                movie = str;

                callback2 = function (response) {
                    var credits = '';
                    response.on('data', function (chunk) {
                        credits += chunk;
                    });
                    response.on('end', function () {
                        movie = JSON.parse(movie);
                        movie.credits = JSON.parse(credits);
                        var cbMovie = movie; // for future use to save credits into the cb local video save.
                        // add in user video / watchlist items to the returned movie
                        app.bucket.get('uid-'+usr.id, function(err, results) {
                            if (err) {
                                return cb(true, err);
                            }
                            var owned = results.value.videos;
                            var watchList = results.value.watchList;

                            for (var i = 0; i < owned.length; i++){
                                if (owned[i].id == "vi-movie-"+movie.id){
                                    movie.format = owned[i].format;
                                    movie.userRating = owned[i].rating;
                                    movie.owned = true;
                                }
                            }
                            for (var i = 0; i < watchList.length; i++){
                                if (watchList[i] == "vi-movie-"+movie.id) {
                                    movie.watchList = true;
                                }
                            }

                            movie.media_type = "movie";

                            return cb(false, JSON.stringify(movie));

                        });
                    });
                };

                http.request(credits, callback2).end();
            });
        };

        http.request(options, callback).end();
        // console.log('movie incoming   ____________________');
        // console.log(movie);
    },


    findTelevisionDetailed: function(id, cb){
        console.log('get the details for television show id '+id);
    },

    // findTelevisionSeason: function(id, user, cb){
    //     console.log('get season information for video id '+id);
    //     var options = {
    //         "host": "api.themoviedb.org",
    //         "path": "/3/tv/"+id+"?api_key=" + config.api.themoviedb
    //     };
    //     var tvDetails = 'temp';
    //
    //     callback = function (response) {
    //         console.log('from within the callback function');
    //         var str = '';
    //         response.on('data', function (chunk) {
    //             str += chunk;
    //         });
    //         response.on('end', function () {
    //             tvDetails = str;
    //             return cb(false, tvDetails);
    //         });
    //
    //     };
    //     http.request(options, callback).end();
    // },

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

    getUserCollection: function(userId, cb) {
        console.log('moviedb getUserCollection fires with userId: '+userId);
        var userVideos = [],
            videos = [];
        app.bucket.get('uid-'+userId, function(err, result){
            console.log('getUserCollection result:');
            console.log(result);
            if (err) { return cb(true, "Problem Accessing User Video Collection" ); }
            for (var i = 0; i < result.value.videos.length; i++){
                var rating = null;
                if (result.value.videos[i].rating != undefined){
                    rating = result.value.videos[i].rating;
                }
                userVideos.push({
                    id: result.value.videos[i].id,
                    format: result.value.videos[i].format,
                    rating: rating
                });
                videos.push(result.value.videos[i].id);
            }
            var watchList =  result.value.watchList;
            var query = ViewQuery.from('video', 'videoById').keys(videos);
            app.bucket.query(query, function(err, results) {
                if (err) { return cb(true, "Problem Loading User Video Collection" ); }
                if (results == null){ return cb(true, "No Movies In Collection Yet" ); }
                for (var i = 0; i < results.length; i++){
                    // todo remove the additional .value. from each record returned
                    for (var x = 0; x < userVideos.length; x++){
                        if (results[i].key == userVideos[x].id){
                            results[i].value.format = userVideos[x].format;
                            results[i].value.userRating = userVideos[x].rating;
                            results[i].value.videoId = userVideos[x].id;
                            results[i].value.watchList = false; // set the default to false.
                        }
                    }
                    for (var x = 0; x < watchList.length; x++){
                        if (results[i].key == watchList[x]){
                            results[i].value.watchList = true;
                        }

                    }
                }
                // console.log(results);
                return cb(false, results);
            });

        })

    },

    getUserWatchlist: function(userId, cb) {
        console.log('moviedb getUserWatchlist fires with userId: '+userId);
        var collection = [];
        // get the user record and requery couchbase videos for the video ids in the watchList array with a keys viewQuery
        app.bucket.get('uid-'+userId, function(err, userResult) {
            if (err) { return cb(true, "Problem Accessing User Watchlist Collection"); }
            var query = ViewQuery.from('video', 'videoById').keys(userResult.value.watchList);
            app.bucket.query(query, function(err, vidResults) {
                // console.log(vidResults); // returned videos in watchlist -need to add in formats owned next.
                // todo remove the additional .value. from each record returned
                for (var i = 0; i < userResult.value.videos.length; i++){
                    // console.log('inside first for - looping the videos document to look for owned formats & user ratings');
                    for (var x = 0; x < vidResults.length; x++){
                        // console.log(vidResults);
                        if ('vi-'+vidResults[x].value.media_type+'-'+vidResults[x].value.id == userResult.value.videos[i].id){
                            vidResults[x].value.format = userResult.value.videos[i].format;
                            if (userResult.value.videos[i].rating == 'undefined'){
                                vidResults[x].value.userRating = false;
                            } else {
                                vidResults[x].value.userRating = userResult.value.videos[i].rating;
                            }
                        }
                        vidResults[x].value.videoId = userResult.value.videos[i].id;
                        vidResults[x].value.watchList = true;
                    }
                }
                if (userResult.value.videos.length == 0){
                    for (var x = 0; x < vidResults.length; x++){
                        vidResults[x].value.watchList = true;
                    }
                }
                // console.log(vidResults);
                return cb(false, vidResults);
            });
        });
    },

    addFormat: function (userId, videoId, format, cb) {
        console.log('adding '+format+' to video '+videoId+' for user '+userId);
        app.bucket.get('uid-'+userId, function(err, result){
            if (err) { return cb(true, "Problem Accessing User Video Collection" ); }
            // check if the incoming videoId matches any of the users current videos
            var added = false;
            for (var i = 0; i < result.value.videos.length; i++){
                // console.log(added);
                // console.log(videoId);
                // console.log(result.value.videos[i].id);
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
    },

    toggleUserWatchList: function(userId, vidId, cb) {
        app.bucket.get('uid-'+userId, function(err, result) {
            if (err) {
                return cb(true, "Problem Accessing User Video Collection");
            }
            var wl = result.value.watchList;
            var add = true, action = 'add';
            for (var i = 0; i < wl.length; i++) {
                if (wl[i] == vidId) {
                    add = false;
                    wl.splice(i, 1);
                }
            }
            if (add) {
                wl.push(vidId);
            }
            var returnValue = result.value;
            returnValue.watchList = wl;
            app.bucket.upsert('uid-' + userId, returnValue, function (err) {
                if (err) {
                    return cb(true, 'Couchbase save function error');
                }
            });
            if (!add){action = 'remove';}
            return cb(false, action);
        });
    }
};

function findTelevisionSeason(id, user, cb){
    //console.log('get season information for video id '+id);
    var options = {
        "host": "api.themoviedb.org",
        "path": "/3/tv/"+id+"?api_key=" + config.api.themoviedb
    };
    var tvDetails = 'temp';

    callback = function (response) {
        //console.log('from within the callback function');
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            tvDetails = str;
            return cb(false, tvDetails);
        });

    };
    http.request(options, callback).end();
}
