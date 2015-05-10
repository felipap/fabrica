
var mongoose = require('mongoose')
var passport = require('passport')
var _ = require('lodash')

var required = require('./lib/required')
var unspam = require('./lib/unspam')

var User = mongoose.model('User')

module.exports = function (app) {
	var router = require('express').Router()

	router.get('/login', function (req, res) {
		if (req.user) {
			return res.redirect('/')
		}
		res.render('app/login')
	})

	router.get('/login/recover', function (req, res) {
		res.render('app/login_recover')
	})

	router.get('/signup', function (req, res) {
		res.render('app/signup')
	})

	router.post('/signup', function (req, res, next) {
		req.parse(User.SingupParseRules, (err, body) => {
			if (body.password1 !== req.body.password2) {
				req.flash('error', 'As senhas não correspondem.')
				return res.redirect('/signup')
			}
			var u = new User({
				name: body.name,
				email: body.email,
				password: body.password1,
			})
			u.save((err, user) => {
				if (err) {
					return next(err)
				}
				req.flash('info', 'Bem-vindo, '+user.name)
				req.logIn(user, (err) => {
					if (err) {
						return next(err)
					}
					res.redirect('/')
				})
			})
		})
	})

	router.post('/login', function (req, res, next) {
		var authFn = (err, user, info) => {
			if (err) {
				return next(err)
			}
			if (!user) {
				req.flash('error', info.message)
				return res.redirect('/login')
			}
			req.logIn(user, (err) => {
				if (err) {
					return next(err)
				}
				res.redirect('/')
			})
		}
		(passport.authenticate('local', authFn))(req, res, next)
	})

	return router
}