
mongoose = require 'mongoose'
_ = require 'lodash'
passport = require 'passport'

required = require './lib/required'
unspam = require './lib/unspam'

User = mongoose.model 'User'

module.exports = (app) ->
	router = require('express').Router()

	router.use (req, res, next) ->
		req.logger = app.get('logger').child(childs: 'APP')
		logger.info("<#{req.user and req.user.username or 'anonymous@'+
			req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		if req.user
			req.user.meta.last_access = new Date()
			req.user.save()
		next()

	router.get '/links/:link', (req, res, next) ->
		if req.params.link of app.locals.urls
			res.redirect(app.locals.urls[req.params.link])
		else
			res.render404()

	router.use '/', require('./signin')(app)

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
			console.log('here')
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

	# Handle 404.
	# Don't 'leak' to other controllers: all / should be "satisfied" here.
	router.use (req, res) ->
		res.render404()

	return router