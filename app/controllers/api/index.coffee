
express = require 'express'
unspam = require '../lib/unspam'
bunyan = require 'app/config/bunyan'
required = require '../lib/required'
aws = require 'aws-sdk'
crypto = require 'crypto'
nconf = require 'app/config/nconf'

module.exports = (app) ->
	api = express.Router()
	logger = app.get('logger').child(child: 'API')

	api.use (req, res, next) ->
		req.logger = logger
		req.logger.info("<#{req.user and req.user.username or 'anonymous@'+req.connection.remoteAddress}>: HTTP #{req.method} #{req.url}")
		req.isAPICall = true
		next()

	api.use unspam

	api.get '/s3/sign', required.login, unspam.limit(1*1000), (req, res) ->
		req.logger.warn "Faz check aqui, felipe"
		aws.config.update({
			accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
			secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
		})
		s3 = new aws.S3()
		key = req.query.s3_object_name
		key = 'media/posts/uimages/'+crypto.randomBytes(10).toString('hex')
		s3_params = {
			Bucket: nconf.get('S3_BUCKET'),
			Key: key,
			Expires: 60,
			# post: req.query.,
			Metadata: {
				'uploader': req.user.id,
			},
			ContentType: req.query.s3_object_type,
			ACL: 'public-read'
		}
		console.log s3_params, {
			accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
			secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
		}
		s3.getSignedUrl 'putObject', s3_params, (err, data) ->
			if err
				console.log('err!', err)
			else
				console.log(data)
				return_data = {
					signed_request: data,
					url: 'https://'+nconf.get('S3_BUCKET')+'.s3.amazonaws.com/'+key
				}
				res.endJSON(return_data)



	# A little backdoor for debugging purposes.
	api.get '/logmein/:username', (req, res) ->
		if nconf.get('env') is 'production'
			if not req.user or
			not req.user.flags.mystique or
			not req.user.flags.admin
				return res.status(404).end()
		is_admin = nconf.get('env') is 'development' or req.user.flags.admin
		User = require('mongoose').model('User')
		User.findOne { username: req.params.username }, (err, user) ->
			if err
				return res.endJSON(error:err)
			if not user
				return res.endJSON(error:true, message:'User not found')
			if not user.flags.fake and not is_admin
				return res.endJSON(error:true, message:'Não pode.')
			logger.info 'Logging in as ', user.username
			req.login user, (err) ->
				if err
					return res.endJSON(error:err)
				logger.info 'Success??'
				res.redirect('/')

	api.use '/users', require('./users') app
	api.use required.login
	api.use '/session', require('./session') app
	api.use '/me', require('./me') app

	# Handle 404.
	# Don't 'leak' to other controllers: all /api/ should be "satisfied" here.
	api.use (req, res) ->
		res.status(404).send(
			error: true
			message: 'Page not found.'
		)

	api