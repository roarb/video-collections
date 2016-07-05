# Video Collection Web App

Built on the CEAN-passo stack - reference material below--

Addition of oAuth via passport-http-oauth handles the /login requests and valid users are stored in couchbase within the 'users' document. Page authentication
can be handled through requesting req.user in the app router, if present, the user is logged in.

A prototype of a registration page containing no security is available at /register, this is meant for an admin to have access to from behind IP firewalls.
The registration could be updated to work directly with new consumer registration, however adding security would depend on an auto generated password, emailed
to the consumer, then after the password was used to log in via oauth, a new password would need to be saved out.

// todo - create a profile section for users
// todo - note - the config file has been updated to handle more then the original CEAN examle, including server port, couchbase information, some login routing data

# Original Couchbase, ExpressJS, AngularJS, Node.js (CEAN) Stack Example

A very basic example of a CEAN stack application that makes use of Couchbase Server's N1QL query language.
The full stack application separates the Node.js, ExpressJS and Couchbase Server into the back-end and leaves AngularJS, HTML, and CSS as the front-end that requests data from the back-end and presents it to the user.

## Prerequisites

There are not many prerequisites required to build and run this project, but you'll need the following:

* Node.js
* Node Package Manager
* Couchbase Server 4+

## Installation & Configuration

Certain configuration in both the application and the database must be done before this project is usable.

### Application

Checkout the latest master branch from GitHub and navigate into it using your Terminal (Mac & Linux) or Command Prompt (Windows).
Assuming you already have Node.js installed, run the following:

```
npm install
```

This will install all dependencies as defined in the **package.json** file.

### Database

This project requires Couchbase 4.0 or higher in order to function because it makes use of the N1QL query language.
With Couchbase Server installed, create a new bucket called **video-collection** or whatever you've named it in your
**config.json** file.
We're not done yet.  In order to use N1QL queries in your application you must create a primary index on your bucket.
This can be done by using the Couchbase Query Client (CBQ).

On Mac, run the following to launch CBQ:

```
./Applications/Couchbase Server.app/Contents/Resources/couchbase-core/bin/cbq
```

On Windows, run the following to launch CBQ:

```
C:/Program Files/Couchbase/Server/bin/cbq.exe
```

With CBQ running, create an index like so:

```
CREATE PRIMARY INDEX ON `video-collection` USING GSI;
```

Your database is now ready for use.

## Testing

With all dependencies installed and Couchbase Server configured, run the following from your Command Prompt or Terminal:

Or, for best results, just use PHPStorm or a similar IDE to run node apps, as debugging is way easier.

```
node app.js
```

Now when you visit **http://localhost:3000** from your web browser you will be able to use the application.

## Resources

Couchbase - [http://www.couchbase.com](http://www.couchbase.com)

ExpressJS - [http://www.expressjs.com](http://www.expressjs.com)

AngularJS - [http://www.angularjs.org](http://www.angularjs.org)

Node.js - [http://www.nodejs.org](http://www.nodejs.org)

Passport - [http://passportjs.org](http://passportjs.org)

Passport -HTTP - OAUTH [https://github.com/jaredhanson/passport-http-oauth](https://github.com/jaredhanson/passport-http-oauth)
