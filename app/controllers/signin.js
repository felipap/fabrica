
'use strict'

var validator = require('validator')
var mongoose = require('mongoose')
var passport = require('passport')
var rclient = require('app/config/redis')

var required = require('./lib/required')
var ccaptcha = require('app/lib/checkCaptcha')
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


	router.post('/login/recover', unspam.limit(5*1000), ccaptcha,
		function(req, res, next) {
		if (!validator.isEmail(req.body.email)) {
			req.flash('error', 'Esse endereço de email é inválido.')
			return res.redirect('/login/recover')
		}

		User.findOne({ email: req.body.email }, req.handleErr((user) => {
			if (!user) {
				req.flash('error', 'Não encontramos um usuário com esse email.')
				return res.redirect('/login/recover')
			}
			userActions.initiateAccountRecovery(user, (err) => {
				if (err) {
					throw err
				}

				req.flash('info', 'Em pouco tempo você receberá um email com '+
					'instruções de como recuperar a sua conta.')
				res.redirect('/login')
			})
		}))
	})

	router.get('/login/recover/:hash', function(req, res) {
		var hash = req.params.hash

		rclient.get('acc_recovery:'+hash, (err, userId) => {
			if (err) {
				throw err
			}

			if (!userId) {
				// Assume the key has expired. It's easier and harmless.
				res.renderError(200, {
					h2: 'Esse pedido de recuperação de conta expirou.',
					msg: 'Clique <a href=\'/login/recover\'>aqui</a> para fazer outro.',
					action: false,
				})
				return
			}

			User.findOne({ _id: userId }, req.handleErr((user) => {
				if (!user) {
					req.logger.error('WTF? Requesting user doesn\'t exist?', userId)
					return // Don't bother responding. Usuário feio!
				}
				res.render('app/login_newpass', { ruser: user })
			}))
		})
	})

	router.post('/login/recover/:hash', unspam.limit(2*1000),
		function(req, res, next) {
			// Mind you this is the same work for the get request.
			// We have to revalidate the hash again.
			var hash = req.params.hash
			rclient.get('acc_recovery:'+hash, (err, userId) => {
				if (err) {
					throw err
				}
				if (!userId) {
					// Assume the key has expired. It's easier and harmless.
					res.renderError(200, {
						h2: 'Esse pedido de recuperação de conta expirou.',
						msg: 'Clique <a href=\'/login/recover\'>aqui</a> para fazer outro.',
						action: false,
					})
					return
				}
				User.findOne({ _id: userId }, req.handleErr((user) => {
					if (!user) {
						req.logger.error('WTF? Requesting user doesn\'t exist?', userId)
						return // Don't bother responding. Usuário feio!
					}
					var pass1 = req.body.password1,
							pass2 = req.body.password2
					if (pass1 !== pass2) {
						req.flash('error', 'As duas senhas não correspondem.')
						res.redirect('/login/recover/'+req.params.hash)
						return
					}
					if (pass1.length < 6) {
						req.flash('error', 'Escolha uma senha com pelo menos 6 caracteres.')
						res.redirect('/login/recover/'+req.params.hash)
						return
					}
					user.password = pass1;
					user.save(req.handleErr((user) => {
						req.login(user, (err) => {
							rclient.del('acc_recovery:'+hash, (err, userId) => {
								res.redirect('/')
							})
						})
					}))
				}))
			})
	})

	router.get('/login/recover', function(req, res) {
		res.render('app/login_recover')
	})

	// router.get('/signup', function(req, res) {
	// 	res.render('app/login_register')
	// })

	// router.post('/signup', unspam.limit(2*1000), function(req, res, next) {
	// 	req.parse(User.SingupParseRules, (body) => {
	// 		User.find({ email: body.email }, req.handleErr((doc) => {
	// 			if (doc) {
	// 				req.flash('error', 'Este email já está em uso. Você já tem uma conta?')
	// 				return res.redirect('/signup')
	// 			}
	// 			if (body.password1 !== req.body.password2) {
	// 				req.flash('error', 'As duas senhas não correspondem.')
	// 				return res.redirect('/signup')
	// 			}
	// 			// userActions.registerSeller({
	// 			// 	name: body.name,
	// 			// 	email: body.email,
	// 			// 	password: body.password
	// 			// })
	// 			var u = new User({
	// 				name: body.name,
	// 				email: body.email,
	// 				password: body.password1,
	// 			})
	// 			u.save((err, user) => {
	// 				if (err) {
	// 					return next(err)
	// 				}
	// 				req.flash('info', 'Bem-vindo, '+user.name)
	// 				req.logIn(user, (err) => {
	// 					if (err) {
	// 						return next(err)
	// 					}
	// 					res.redirect('/')
	// 				})
	// 			})
	// 		}))
	// 	})
	// })

	return router
}