
var mongoose = require('mongoose')
var unportuguesizer = require('app/lib/unportuguesizer')
var please = require('app/lib/please')
var TMERA = require('app/lib/tmera')
var mail = require('app/actions/mail')

var User = mongoose.model('User')
var logger = global.logger.mchild()

module.exports.register = function (self, data, cb) {
	please({$model:User}, '$skip', '$isFn')

	User.findOne({ email: data.email }, TMERA((repeat) => {
		if (repeat) {
			return cb({
				type: 'APIError',
				name: 'ExistingUser',
				msg: 'Esse usuário já existe.',
			})
		}

		var u = new User({
			name: data.name,
			email: data.email,
			phone: data.phone,
			flags: {
				admin: false,
				seller: false,
			}
		})

		u.save(TMERA((doc) => {
			cb(null, doc)
		}))
	}))
}

module.exports.initiateAccountRecovery = function (user, cb) {
	please({$model:User}, '$skip', '$isFn')

	mail.sendEm
}