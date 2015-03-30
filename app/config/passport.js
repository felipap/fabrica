
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
				console.log('user found?', user)
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Email ou senha incorretos.' })
				}
				user.usesPassword(password, function (err, does) {
					if (err)
						return done(err);
					if (does)
						return done(null, user);
					else
						return done(null, false, { message: 'Email ou senha incorretos.' })
				})
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