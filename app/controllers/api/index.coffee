
express = require 'express'
unspam = require '../lib/unspam'
bunyan = require 'app/config/bunyan'
required = require '../lib/required'
aws = require 'aws-sdk'
uuid = require 'uuid'
nconf = require 'nconf'
mongoose = require 'mongoose'

userActions = require 'app/actions/users'
orderActions = require 'app/actions/orders'
mail = require 'app/actions/mail'

User = mongoose.model('User')
Order = mongoose.model('Order')

aws.config.update({
	accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
	secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
})
s3 = new aws.S3()

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child(child: 'API')

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.name or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()

	api.use unspam

	# A little backdoor for debugging purposes.
	api.get '/logmein/:id', (req, res) ->
		if nconf.get('env') is 'production'
			if not req.user or
			not req.user.flags.mystique or
			not req.user.flags.admin
				return res.status(404).end()
		is_admin = nconf.get('env') is 'development' or req.user.flags.admin
		User.findOne { _id: req.params.id }, (err, user) ->
			if err
				return res.endJSON(error:err)
			if not user
				return res.endJSON(error:true, message:'User not found')
			if not user.flags.fake and not is_admin
				return res.endJSON(error:true, message:'Não pode.')
			logger.info 'Logging in as ', user.name, user.email
			req.login user, (err) ->
				if err
					return res.endJSON(error:err)
				logger.info 'Success??'
				res.redirect('/')

	api.use '/users', require('./users') app
	api.use required.login
	api.use '/session', require('./session') app
	api.use '/me', require('./me') app

	api.post '/orders', unspam.limit(2*1000), (req, res, next) ->
		req.parse Order.ParseRules, req.handleErr (body) ->
			console.log(body)
			orderActions.register req.user, body, (err, result) ->
				console.log("registerd?", result)

	api.post '/clients', unspam.limit(2*1000), (req, res, next) ->
		req.parse User.ClientRegisterParseRules, (err, reqbody) ->
			if err
				return next(err)
			console.log(reqbody)
			userActions.registerClient req.user, reqbody, (err, client) ->
				if err
					return next(err)
				res.endJSON(reqbody)

	api.get '/clients/exists', unspam.limit(1*1000), (req, res, next) ->
		if not validator.isEmail(req.query.email)
			next(name:'APIError', message:'Esse endereço de email é inválido.')
			return

		User.findOne { email: req.query.email }, req.handleErr (user) ->
			res.endJSON(exists: user and user.toJSON())


	api.get '/orders', unspam.limit(1*1000), (req, res) ->
		Order.find { }, req.handleErr (docs) ->
			res.endJSON(docs)

	api.get '/myclients', unspam.limit(1*1000), (req, res) ->
		User.find { 'flags.seller': false }, req.handleErr (clients) ->
			res.endJSON(clients)

	api.get '/s3/sign', unspam.limit(1*1000), (req, res) ->
		req.logger.warn "Faz check aqui, felipe"
		key = 'jobs/'+uuid.v4()
		params = {
			Bucket: nconf.get('S3_BUCKET'),
			Key: key,
			Expires: 60
			ACL: 'public-read'
			ContentType: req.query.type,
			# Metadata: {
			# 	'uploader': req.user.id,
			# },
		}
		s3.getSignedUrl 'putObject', params, (err, data) ->
			if err
				console.log('err!', err)
			else
				console.log('data', params, data)
				return_data = {
					signed_request: data,
					url: 'https://'+nconf.get('S3_BUCKET')+'.s3.amazonaws.com/'+key
				}
				res.endJSON(return_data)


	# Handle 404.
	# Don't 'leak' to other controllers: all /api/ should be "satisfied" here.
	api.use (req, res) ->
		res.status(404).send(
			error: true
			message: 'Page not found.'
		)

	api