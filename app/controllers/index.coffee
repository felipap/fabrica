
mongoose = require 'mongoose'
_ = require 'lodash'
passport = require 'passport'

required = require './lib/required'
unspam = require './lib/unspam'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	logger = app.get('logger').child(childs: 'APP')

	router.use (req, res, next) ->
		req.logger = logger
		logger.info("<#{req.user and req.user.username or 'anonymous@'+
			req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		next()

	# router.use '/signup', (require './signup') app

	# Deal with signups, new sessions, tours and etc.
	router.use (req, res, next) ->
		if req.user
			req.user.meta.last_access = new Date()
			req.user.save()
		next()

	router.get '/links/:link', (req, res, next) ->
		if req.params.link of app.locals.urls
			res.redirect(app.locals.urls[req.params.link])
		else
			res.render404()

	router.get '/login', (req, res) ->
		if req.user
			return res.redirect('/')
		res.render 'app/login', {}

	router.get '/signup', (req, res) ->
		res.render 'app/signup', {}

	router.post '/signup', (req, res, next) ->
		req.parse User.SingupParseRules, (err, body) ->
			if body.password1 isnt req.body.password2
				req.flash('error', 'As senhas não correspondem.')
				return res.redirect('/signup')
			u = new User {
				name: body.name,
				email: body.email,
				password: body.password1,
			}
			u.save (err, user) ->
				if err
					return next(err)
				req.flash('info', 'Bem-vindo, '+user.name)
				req.logIn user, (err) ->
					if err
						return next(err)
					res.redirect('/')

	router.post '/login', (req, res, next) ->
		authFn = (err, user, info) ->
			if err
				return next(err)
			if not user
				req.flash('error', info.message)
				return res.redirect('/login')
			req.logIn user, (err) ->
			if err
					return next(err)
				res.redirect('/')
		(passport.authenticate 'local', authFn)(req, res, next)

	router.use '/', (req, res, next) ->
		if not req.user
			return res.redirect('/login')
		next()

	for n in [
		'/'
		'/novo'
		'/novo/pedido'
		'/clientes'
		'/novo/cliente'
	]
		router.get n, (req, res, next) ->
			res.render 'app/home'

	router.get '/arquivos', (req, res, next) -> res.render 'app/files'
	router.get '/ajuda', (req, res, next) -> res.render 'app/help'

	router.get '/entrar', (req, res) -> res.redirect '/login'
	router.get '/settings', required.login, (req, res) -> res.render 'app/settings'
	router.get '/conta', required.login, (req, res) -> res.render 'app/account'
	router.get '/contato', required.login, (req, res) -> res.render 'app/contact'

	router.get '/sobre', (req, res) -> res.render('about/main')
	router.get '/faq', (req, res) -> res.render('about/faq')
	router.get '/blog', (req, res) -> res.redirect('http://blog.deltathinkers.com')
	router.use '/auth', require('./passport')(app)

	return router