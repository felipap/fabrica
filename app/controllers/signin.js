
var validator = require('validator')
var mongoose = require('mongoose')
var passport = require('passport')
var _ = require('lodash')

var required = require('./lib/required')
var unspam = require('./lib/unspam')
var TMERA = require('app/lib/tmera')
var userActions = require('app/actions/users')

var User = mongoose.model('User')

module.exports = function(app) {
	var router = require('express').Router()

	router.get('/login', function(req, res) {
		if (req.user) {
			return res.redirect('/')
		}
		res.render('app/login')
	})

	router.post('/login/recover', unspam.limit(2*1000), function(req, res, next) {
		if (!validator.isEmail(req.body.email)) {
			req.flash('error', 'Esse endereço de email é inválido.');
			return res.redirect('/login/recover');
		}

		User.find({ email: req.body.email }, req.handleErr((user) => {
			if (!user) {
				req.flash('error', 'Não encontramos ')
				return res.redirect('/login')
			}
			// userActions.initiateRecoverAccount(req.)
			req.flash('info', 'Em pouco tempo você receberá um email com instruções'+
				'com instruções de como resetar a sua senha.')
			res.redirect('/login')
		}))
	})

	router.get('/login/recover', function(req, res) {
		res.render('app/login_recover')
	})

	router.get('/signup', function(req, res) {
		res.render('app/login_register')
	})

	router.post('/signup', unspam.limit(2*1000), function(req, res, next) {

		req.parse(User.SingupParseRules, (err, body) => {
			User.find({ email: body.email }, req.handleErr((doc) => {
				if (doc) {
					req.flash('error', 'Este email já está em uso. Você já tem uma conta?')
					return res.redirect('/signup')
				}

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
			}));
		})
	})

	router.post('/login', function(req, res, next) {
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