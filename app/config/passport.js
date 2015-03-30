
var passport = require('passport');
var nconf = require('nconf');
var actions = require('app/actions/passport');

var mongoose = require('mongoose')

var User = mongoose.model('User')

var LocalStrategy = require('passport-local').Strategy;

function setUpPassport(app) {

	passport.use(new LocalStrategy(
		{
	    usernameField: 'email',
	  },
		function(email, password, done) {
			User.findOne({ email: email }, function (err, user) {
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Email ou senha incorretos.' })
				}
				if (!user.usesPassword(password)) {
					return done(null, false, { message: 'Email ou senha incorretos.' })
				}
				return done(null, user);
			});
		})
	);

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		var User = require('mongoose').model('User');
		User.findOne({_id: id}, function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport;