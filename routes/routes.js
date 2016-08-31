var RecordModel = require("../models/recordmodel");
var passport = require('passport');
require('./../auth/auth');
var db = require('./../db');
var config = require('./../config');
var crypto = require('./../auth/local-crypto');
var uuid = require('node-uuid');

var appRouter = function(app) {

    /**
     * Sessions
     *
     * In a typical web application, the credentials used to authenticate a user will only be transmitted during the login request.
     * If authentication succeeds, a session will be established and maintained via a cookie set in the user's browser.
     *
     * Each subsequent request will not contain credentials, but rather the unique cookie that identifies the session.
     * In order to support login sessions, Passport will serialize and deserialize user instances to and from the session.
     */
    
    passport.serializeUser(function(user, done) {
        // console.log('serialize User Id: '); console.log(user.id);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        // console.log('deserializeUser runs'); console.log(id);
        db.users.findById(id, function(err, user) {
            if (err) { return done(err); }
            done(err, user);
        });
    });

    /**
     * In this example, only the user ID is serialized to the session, keeping the amount of data stored within the session small.
     * When subsequent requests are received, this ID is used to find the user, which will be restored to req.user.
     *
     *     The serialization and deserialization logic is supplied by the application, allowing the application to choose an
     * appropriate database and/or object mapper, without imposition by the authentication layer.
     */
    
    
    app.get("/", function(req, res){
        //console.log(req.user);
        if(!req.user) {
            return res.render('login', { title: 'TrackRight.org', user: false, url:"login"});
        }
        res.render('index', { title: 'TrackRight.org', user: req.user, url:"home"} );
    });

    app.get('/home', function(req, res) {
        console.log(req.user);
        if (!req.user) {
            return res.render("login", {title: 'TrackRight.org', user: false, url:"login"});
        }
        res.render('index', { title: 'TrackRight.org', user: req.user, url:"home"});
    });

    app.get('/login', function(req, res) {
        console.log(req.user);
        if (!req.user) {
            return res.render("login", {title: 'TrackRight.org', user: false, url:"login"});
        }
        res.render('index', { title: 'TrackRight.org', user:req.user, url:"home"});
    });

    app.get('/account', function(req, res){
       if (!req.user) {
           return res.render("login", {title: 'TrackRight.org', user: false, url:"login"});
       }
       res.render('account', { title: req.user.username + "'s Account", user:req.user, account:JSON.stringify(req.user), url:"account"});
    });

    app.get('/collection', function(req, res){
        console.log('/collection hit');
        console.log(req.user);
        if (!req.user) {
            return res.render("login", {title: 'TrackRight.org', user: false, msg:'Please Login First', url:"login"});
        }
        res.render('vid_collection', { title: req.user.username + "'s Collection", user:req.user, url:"collection", collection:"videoCollection"});
    });

    app.get('/watch-list', function(req, res){
        if (!req.user) {
            return res.render("login", {title: 'TrackRight.org', user: false, msg:'Please Login First', url:"login"});
        }
        res.render('vid_collection', { title: req.user.username + "'s To Watch List", user:req.user, url:"watch-list", collection:"watchlistCollection"});
    });

    app.get('/video', function(req, res){
        var vidId = req.query.vidId;
        var type = req.query.type;
        var name = req.query.name;
        if (!req.user) {
            return res.render("login", {title: 'TrackRight.org', user: false, msg:'Please Login First', url:"login"});
        }
        if (!vidId) {
            return res.send('no vidId set.');
        }
        res.render('video', { title: name, user:req.user, url:"video", vidId: vidId, type: type});
    });

    // todo change config to drop the login.loc --- un-needed
    app.post(config.login.loc, function(req, res, next) {
        console.log('login post hit req incoming:');
        console.log(req.body);
        passport.authenticate('consumer', function(err, user) {
            // if (err) { console.log("error in passport.authenticate"); }
            if (!user){
                console.log("error ="+err);
                console.log("user inc: "); console.log(user);
                console.log('no user found in post /login-request');
                return res.send(JSON.stringify({"err": err, "msg":"user not found", "user":false}));
            }

            req.logIn(user, function(err){
                if (err) { return next(err); }
                console.log('user found in /login-request ...');
                return res.send(JSON.stringify({"err": err, "msg":"found a match!"}));
            })
        })(req, res, next);
    });

    // todo change the config to drop the logout.loc --- un-needed
    app.get(config.logout.loc, function(req, res){
        req.logout();
        req.session.destroy(function (err) {
            if (err) { return next(err); }
            // The response should indicate that the user is no longer authenticated.
            return res.render('login', { title: 'logged out' });
        });
    });

    app.get('/register', function(req, res) {
        res.render('register', { title: 'admin-level - sign up a new user' });
    });

    app.post('/register', function(req, res, next) {
        console.log('register post hit');
        db.users.registerUser(JSON.stringify(req.body), function(error, result){
            if (error){
                return res.send(result);
            }
        });
        return res.render('login', { title: "New User Signed Up" });
    });

    // search videos API calls
    app.post("/api/1/search/multi", function(req, res, next) {
        db.moviedb.findByName(req.query.query, req.user, function(err, videos){
            //console.log("api 1 search multi - in callaback to findByName");
            return res.status(false).send(videos);
        });
    });

    // add video - format to user document
    app.post("/api/1/add/format", function(req, res, next){
        db.moviedb.addFormat(req.user.id, req.body.videoId, req.body.format, function(err, result) {
            res.send(JSON.stringify({"err": err, "msg": result}));
        });
    });

    // remove video - format to user document
    app.post("/api/1/remove/format", function(req, res, next){
        db.moviedb.removeFormat(req.user.id, req.body.videoId, req.body.format, function(err, result) {
            res.send(JSON.stringify({"err": err, "msg": result}));
        });
    });

    // get user collection of videos
    app.post("/api/1/user/collection", function(req, res, next){
        console.log('post - api/1/user/collection hit');
        db.moviedb.getUserCollection(req.user.id, function(err, result) {
            res.send(JSON.stringify({"err": err, "msg": result}));
        })
    });

    // get user watchlist collection
    app.post("/api/1/user/watchlist", function(req, res, next){
        console.log('post - api/1/user/watchlist hit');
        db.moviedb.getUserWatchlist(req.user.id, function(err, result) {
            res.send(JSON.stringify({"err": err, "msg": result}));
        })
    });

    // get all user information
    app.post("/api/1/get/user", function(req, res, next){
        console.log('get user request');
        db.users.getUserData(req.user.id, function(err, result) {
            res.send(JSON.stringify({"err": err, "msg": result}));
        })
    });

    // toggle user watchlist videos
    app.post("/api/1/watchlist/toggle", function(req, res, next) {
        console.log('watchlist/toggle hit');
        db.moviedb.toggleUserWatchList(req.user.id, req.query.videoId, function(err, result){
            res.send(JSON.stringify({"err": err, "msg": result}));
        });
    });

    // get a single video details
    app.post("/api/1/video/details", function(req, res, next) {
        console.log('video details hit');
        console.log(req.body.id);
        console.log(req.body.type);
        if (req.body.type == "movie"){
            console.log('movie type found - hitting db.moviedb.findMovieDetailed to make api request.');
            db.moviedb.findMovieDetailed(req.body.id, req.user, function(err, result){
                // console.log(result);
                if (err) { res.send('Error Loading Movie') }
                res.send(result);
            })
        }
        else if (req.body.type == "tv"){
            db.moviedb.findTelevisionDetailed(req.body.id, req.user, function(err, res){
                console.log(res);
                res.send(res);
            })
        } else {
            res.send('404');
        }
    });

    // facebook passport strategy //
    app.get("/auth/facebook", function(req, res, next) {
        passport.authenticate('facebook', { scope: ['user_friends', 'public_profile', 'email'] }, function(err, user){
            req.logIn(user, function(err){
                if (err) { return next(err); }
                console.log('user found in facebook login ...');
                res.redirect('/home');
                //return res.send(JSON.stringify({"err": err, "msg":"found a match!"}));
            })
        })(req, res, next);
    });

    // app.get("/auth/facebook/callback", passport.authenticate('facebook', { failureRedirect: '/login' }),
    //     function(req, res){
    //     // successful authentication, redirect home
    //         res.redirect('/home');
    //     });
    app.get("/auth/facebook/callback", function(req ,res ,next) {
        passport.authenticate('facebook', { scope: ['user_friends', 'public_profile', 'email'] }, function(err, user){
            req.logIn(user, function(err){
                if (err) { return next(err); }
                console.log('user found in facebook login ...');
                res.redirect('/home');
                //return res.send(JSON.stringify({"err": err, "msg":"found a match!"}));
            })
        })(req, res, next);
    });

    // original CEAN sample examples below //

    app.post("/api/delete", function(req, res) {
        if(!req.body.document_id) {
            return res.status(400).send({"status": "error", "message": "A document id is required"});
        }
        RecordModel.delete(req.body.document_id, function(error, result) {
            if(error) {
                return res.status(400).send(error);
            }
            res.send(result);
        });
    });

    app.post("/api/save", function(req, res) {
        if(!req.body.firstname) {
            return res.status(400).send({"status": "error", "message": "A firstname is required"});
        } else if(!req.body.lastname) {
            return res.status(400).send({"status": "error", "message": "A lastname is required"});
        } else if(!req.body.email) {
            return res.status(400).send({"status": "error", "message": "A email is required"});
        }
        RecordModel.save(req.body, function(error, result) {
            if(error) {
                return res.status(400).send(error);
            }
            res.send(result);
        });
    });

    app.get("/api/get", function(req, res) {
        if(!req.query.document_id) {
            return res.status(400).send({"status": "error", "message": "A document id is required"});
        }
        RecordModel.getByDocumentId(req.query.document_id, function(error, result) {
            if(error) {
                console.log(error);
                return res.status(400).send(error);
            }
            res.send(result);
        });
    });

    app.get("/api/getAllUsr", function(req, res) {
        RecordModel.getAllUsr(function(error, result) {
            if(error) {
                return res.status(400).send(error);
            }
            res.send(result);
        });
    });

};

module.exports = appRouter;
