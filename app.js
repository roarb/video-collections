var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var expressSession = require("express-session");
var passport = require("passport");
var couchbase = require("couchbase");
var path = require("path");
var config = require("./config");
var app = express();

var auth = ('./auth/auth');
var db = ('./db');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
/**
 * Middleware
 * 
 * In a Connect or Express-based application, passport.initialize() middleware is required to initialize Passport.
 * If your application uses persistent login sessions, passport.session() middleware must also be used.
 */
app.use(expressSession({secret:'bazinga', resave:'', saveUninitialized:''}));
app.use(passport.initialize());
app.use(passport.session());

// Global declaration of the Couchbase server and bucket to be used
exports.bucket = (new couchbase.Cluster(config.couchbase.server)).openBucket(config.couchbase.bucket);

app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// All endpoints to be used in this application
var routes = require("./routes/routes.js")(app);

var server = app.listen(config.server.ip, function () {
    console.log("Listening on port %s...", server.address().port);
});
