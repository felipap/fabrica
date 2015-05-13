
"use strict"

var mongoose = require('mongoose')
var passport = require('passport')
var _ = require('lodash')

var required = require('./lib/required')
var unspam = require('./lib/unspam')

var User = mongoose.model('User')

module.exports = function (app) {
	var router = require('express').Router()
	var logger = app.get('logger').child({ childs: 'APP' })

	router.use(function (req, res, next) {
		req.logger = logger;
		logger.info("<"+(req.user && req.user.name || 'anonymous@'+
			req.connection.remoteAddress)+">: HTTP "+req.method+" "+req.url+"")
		if (req.user) {
			req.user.meta.last_access = new Date()
			req.user.save()
		}
		next()
	})

	router.get('/links/:link', function (req, res, next) {
		if (req.params.link in app.locals.urls) {
			res.redirect(app.locals.urls[req.params.link])
		} else {
			res.render404()
		}
	})

	router.use('/', require('./signin')(app))

	router.use('/', function (req, res, next) {
		if (!req.user) {
			return res.redirect('/login')
		}
		next()
	})

	router.get('/', function (req, res) {
		res.redirect('/pedidos');
	})

	var homeRoutes = [
		'/',
		'/clientes',
		'/novo/cliente',
		'/pedidos',
		'/pedidos/:code',
		'/novo/pedido',
	]
	_.map(homeRoutes, function (route) {
		router.get(route, (req, res) => { res.render('app/home') })
	})

	var routeTmpls = {
		'/arquivos': 'app/files',
		'/ajuda': 'app/help',
		'/settings': 'app/settings',
		'/conta': 'app/account',
		'/contato': 'app/contact',
		'/sobre': 'about/main',
		'/faq': 'about/faq',
	}
	_.map(routeTmpls, function (route, tmpl) {
		router.get(route, (req, res) => res.render(tmpl))
	})

	router.use('/auth', require('./passport')(app))

	// Handle 404.
	// Don't 'leak' to other controllers: all / should be "satisfied" here.
	router.use(function (req, res) {
		res.render404()
	})

	return router
}