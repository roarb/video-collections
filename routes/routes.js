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
        console.log('serialize User Id: '); console.log(user.id);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        console.log('deserializeUser runs'); console.log(id);
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
            return res.render('login', { title: 'ERROR - Log in first' });
        }
        res.render('index', { title: 'Angular Example - launched from express ejs tempate', user:req.user} );
    });

    app.get('/home', function(req, res) {
        console.log('home loads');
        console.log(req.user);
        if (!req.user) {
            return res.render("login", {title: 'Login First'});
        }
        res.render('index', { title: 'logged in', user:req.user});
    });

    app.get('/login', function(req, res) {
        console.log(req.user);
        if (!req.user) {
            return res.render("login", {title: 'Login First'});
        }
        res.render('index', { title: 'logged in', user:req.user});
    });

    app.post(config.login.loc, function(req, res, next) {
        console.log('login post hit');
        passport.authenticate('consumer', function(err, user) {
            if (err) { console.log(err); }
            if (!user){
                return res.send(JSON.stringify({"err": err, "msg":"user not found", "user":false}));
            }

            req.logIn(user, function(err){
                if (err) { return next(err); }
                return res.send(JSON.stringify({"err": err, "msg":"found a match!"}));
            })
        })(req, res, next);
    });

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
        console.log('api/1/search/multi hit');
        console.log(req.body.query);
        var lookup = db.moviedb.findByName(req.body.query);
        console.log(lookup);
        return res.send('api hit');
    });

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
