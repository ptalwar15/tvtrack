var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// ========= Show mongoose schema =========
// A schema is just an abstract representation of the data
// representation of data in MongoDB
var showSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  airsDayOfWeek: String,
  airsTime: String,
  firstAired: Date,
  genre: [String],
  network: String,
  overview: String,
  rating: Number,
  ratingCount: Number,
  status: String,
  poster: String,
  // an array of User ObjectIDs, references to User documents.
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  episodes: [{
    season: Number,
    episodeNumber: Number,
    episodeName: String,
    firstAired: Date,
    overview: String
  }]
});
// ========= end of Show mongoose schema =========

// ========= User mongoose schema =========
var userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});

// Here we are using pre-save mongoose middleware
// and comparePassword instance method for password validation
userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
// ========= end of User mongoose schema =========

// A model on the other hand is a concrete object
// with methods to query, remove, update and save data
// from/to MongoDB.
var User = mongoose.model('User', userSchema);
var Show = mongoose.model('Show', showSchema);
// connect to the database
mongoose.connect("mongodb://ptalwar15:Coolit12@ds053784.mongolab.com:53784/tvtrack");

// ========== End of DB Setup ==========
var session = require('express-session');
var passport = require('passport');
// user Passport's LocalStrategy to sign in with username & password.
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// below code snippet almost identical with the Passport Configure's page
// Only, we override username field to be called email field.
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false);
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if (isMatch) return done(null, user);
      return done(null, false);
    });
  });
}));

// Agenda is a job scheduling library for Node.js
var mongoConnectionString = "mongodb://ptalwar15:Coolit12@ds053784.mongolab.com:53784/tvtrack"
var agenda = require('agenda')({ db: { address: mongoConnectionString } });
var sugar = require('sugar');
var nodemailer = require('nodemailer');

// define an agenda job called send email alert.
agenda.define('send email alert', function(job, done) {
  // what should happen when send email alert job is dispatched.
  // When this job runs, name of the show will be passed in as an optional data object.
  // Since we are not storing the entire user document in subscribers array (only references),
  // we have to use Mongoose’s populate method.
  Show.findOne({ name: job.attrs.data }).populate('subscribers').exec(function(err, show) {
    var emails = show.subscribers.map(function(user) {
      return user.email;
    });

    var upcomingEpisode = show.episodes.filter(function(episode) {
      return new Date(episode.firstAired) > new Date();
    })[0];

    var smtpTransport = nodemailer.createTransport('SMTP', {
       service: 'gmail',
      auth: { user: 'tvtrack2015@gmail.com', pass: 'Coolit12' }
    });

    // standard Nodemailer boilerplate for sending emails.
    var mailOptions = {
      from: 'TV TRACK ✔ <tvtrack2015@gmail.com>',
      to: emails.join(','),
      subject: show.name + ' is starting soon!',
      text: show.name + ' starts in less than 2 hours on ' + show.network + '.\n\n' +
        'Episode ' + upcomingEpisode.episodeNumber + ' Overview\n\n' + upcomingEpisode.overview
    };

    smtpTransport.sendMail(mailOptions, function(error, response) {
      console.log('Message sent: ' + response.message);
      smtpTransport.close();
      done();
    });
  });
});

agenda.start();

agenda.on('start', function(job) {
  console.log("Job %s starting", job.attrs.name);
});

agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});


var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('lodash');

// gzip compression.
var compress = require('compression');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(compress());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
// Static assets caching
// 86400000 milliseconds is equivalent to 1 day.
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));
app.use(session({ secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());

// Protect our routes from unauthenticated requests.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else res.send(401);
}

// ========== Query and parse the TVDB API ==========
app.post('/api/shows', function(req, res, next) {
  var apiKey = '27651C060F8FB1D7';
  // xml2js parser to normalize all tags to lowercase
  // and disable conversion to arrays when there is only one child element.
  var parser = xml2js.Parser({
    explicitArray: false,
    normalizeTags: true
  });
  // exmaple: Breaking Bad it will be converted to breaking_bad
  var seriesName = req.body.showName
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^\w-]+/g, '');

  // async to manage multiple asynchronous operations
  async.waterfall([
    // First: Get the Show ID given the Show Name and pass it on to the next function.
    function(callback) {
      request.get('http://thetvdb.com/api/GetSeries.php?seriesname=' + seriesName, function(error, response, body) {
        if (error) return next(error);
        parser.parseString(body, function(err, result) {
          // validation check to see if the seriesid exists.
          if (!result.data.series) {
            return res.send(404, { message: req.body.showName + ' was not found.' });
          }
          var seriesId = result.data.series.seriesid || result.data.series[0].seriesid;
          callback(err, seriesId);
        });
      });
    },
    // Second: Get the show information using the Show ID from previous step and pass the new show object on to the next function.
    function(seriesId, callback) {
      request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesId + '/all/en.xml', function(error, response, body) {
        if (error) return next(error);
        parser.parseString(body, function(err, result) {
          var series = result.data.series;
          var episodes = result.data.episode;
          var show = new Show({
            _id: series.id,
            name: series.seriesname,
            airsDayOfWeek: series.airs_dayofweek,
            airsTime: series.airs_time,
            firstAired: series.firstaired,
            genre: series.genre.split('|').filter(Boolean),
            network: series.network,
            overview: series.overview,
            rating: series.rating,
            ratingCount: series.ratingcount,
            runtime: series.runtime,
            status: series.status,
            poster: series.poster,
            episodes: []
          });
          _.each(episodes, function(episode) {
            show.episodes.push({
              season: episode.seasonnumber,
              episodeNumber: episode.episodenumber,
              episodeName: episode.episodename,
              firstAired: episode.firstaired,
              overview: episode.overview
            });
          });
          callback(err, show);
        });
      });
    },
    // Third: Convert the poster image to Base64, assign it to show.poster and pass the show object to the final callback function.
    // each image is about 30% larger in the Base64 form
    function(show, callback) {
        var url = 'http://thetvdb.com/banners/' + show.poster;
        request({ url: url, encoding: null }, function(error, response, body) {
          show.poster = 'data:' + response.headers['content-type'] + ';base64,' + body.toString('base64');
          callback(error, show);
        });
      }
    ],
    // Save the show object to database.
    function(err, show) {
      if (err) return next(err);
      show.save(function(err) {
        if (err) {
          // Error code 11000 refers to the duplicate key error.
          if (err.code == 11000) {
            // 409, HTTP status code to indicate some sort of conflict
            return res.send(409, { message: show.name + ' already exists.' });
          }
          return next(err);
        }
        // It will start the agenda task whenever a new show is added to the database.
        //  Sugar overrides built-in objects such as Date to provide us with extra functionality.
        var alertDate = Date.create('Next ' + show.airsDayOfWeek + ' at ' + show.airsTime).rewind({ hour: 2});
        agenda.schedule(alertDate, 'send email alert', show.name).repeatEvery('1 week');
        res.send(200);
      });
    });
  });
  // ========== End of Query and parse the TVDB API ==========

app.get('/api/shows', function(req, res, next) {
  var query = Show.find();
  if (req.query.genre) {
    query.where({ genre: req.query.genre });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } else {
    query.limit(12);
  }
  query.exec(function(err, shows) {
    if (err) return next(err);
    res.send(shows);
  });
});

app.get('/api/shows/:id', function(req, res, next) {
  Show.findById(req.params.id, function(err, show) {
    // If there an error it will be passed on to the error middleware and handled there as well.
    if (err) return next(err);
    res.send(show);
  });
});

// When the user tried to sign-in from AngularJS app,
// a post request is sent with user's email and password as object.
// this data passed to Passport LocalStrategy.
// if email is found, password is valid then a new cookie is created with user object, and send back to client.
app.post('/api/login', passport.authenticate('local'), function(req, res) {
  res.cookie('user', JSON.stringify(req.user));
  res.send(req.user);
});

// [FIX THIS} This is simplified version without input validation.
app.post('/api/signup', function(req, res, next) {
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err) {
    if (err) return next(err);
    res.send(200);
  });
});


// Passport expose a logout() function on req object that can be called from any route which terminates a login session.
// Invoking logout() will remove req.user property and clear the login session.
app.get('/api/logout', function(req, res, next) {
  req.logout();
  res.send(200);
});

app.use(function(req, res, next) {
  if (req.user) {
    res.cookie('user', JSON.stringify(req.user));
  }
  next();
});

// two routes for subscribing and unsibscribing to/from a show
//  ensureAuthenticated middleware here to prevent unauthenticated users from accessing these route handlers.
app.post('/api/subscribe', ensureAuthenticated, function(req, res, next) {
  Show.findById(req.body.showId, function(err, show) {
    if (err) return next(err);
    show.subscribers.push(req.user.id);
    show.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});

app.post('/api/unsubscribe', ensureAuthenticated, function(req, res, next) {
  Show.findById(req.body.showId, function(err, show) {
    if (err) return next(err);
    var index = show.subscribers.indexOf(req.user.id);
    show.subscribers.splice(index, 1);
    show.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
});


// Common problem when you use HTML5 pushState on the client-side
// Create a redirect route.
// Add this route before the error handler
// * wild card that will match any route that you type.
app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
