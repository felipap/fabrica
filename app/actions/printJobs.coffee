
mongoose = require 'mongoose'
unportuguesizer = require 'app/lib/unportuguesizer'
please = require 'app/lib/please'
TMERA = require 'app/lib/tmera'

User = mongoose.model('User')
logger = global.logger.mchild()

module.exports.make = (self, data, cb) ->
	please {$model:User}, '$skip', '$isFn'

	User.findOne { email: data.email }, TMERA (repeat) ->
		if repeat
			return cb(type:'APIError', name:'ExistingUser', msg:'Esse usuário já existe.')

		u = new User {
			name: data.name
			email: data.email
			phone: data.phone
			flags: {
				admin: false
				seller: false
			}
		}

		u.save TMERA (doc) ->
			cb(null, doc)