
async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'

required = require '../lib/required'
unspam = require '../lib/unspam'
please = require 'app/lib/please.js'
jobs = require 'app/config/kue.js'
redis = require 'app/config/redis.js'

TMERA = require 'app/lib/tmera'

User = mongoose.model 'User'

####

module.exports = (app) ->
	router = require('express').Router()

	router.param 'userId', (req, res, next, userId) ->
		try
			id = mongoose.Types.ObjectId.createFromHexString(userId);
		catch e
			return next({ type: "InvalidId", args:'userId', value:userId});
		User.findOne { _id:userId }, req.handleErr404 (user) ->
			req.requestedUser = user
			next()

	router.param 'username', (req, res, next, username) ->
		User.findOne { username:username }, req.handleErr404 (user) ->
			req.requestedUser = user
			next()

	router.get '/:userId', (req, res) ->
		if req.user.flags.admin
			res.endJSON req.requestedUser.toObject()
		else
			res.endJSON req.requestedUser.toJSON()

	return router