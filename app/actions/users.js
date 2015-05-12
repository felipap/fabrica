
var mongoose = require('mongoose')
var crypto = require('crypto')

var please = require('app/lib/please')
var TMERA = require('app/lib/tmera')
var mail = require('app/actions/mail')

var rclient = require('app/config/redis')

var User = mongoose.model('User')
var logger = global.logger.mchild()

module.exports.register = function (self, data, cb) {
	please({$model:User}, '$skip', '$isFn')

	User.findOne({ email: data.email }, TMERA((repeat) => {
		if (repeat) {
			return cb({
				name: 'APIError',
				type: 'ExistingUser',
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
	// http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
	function randomValueBase64 (len) {
		return crypto.randomBytes(Math.ceil(len * 3 / 4))
			.toString('base64')   // convert to base64 format
			.slice(0, len)        // return required number of characters
			.replace(/\+/g, '0')  // replace '+' with '0'
			.replace(/\//g, '0'); // replace '/' with '0'
	}

	please({$model:User}, '$isFn')

	var hash = randomValueBase64(12)
	var link = 'http://app.deltathinkers.com/login/recover/'+hash
	var key = 'acc_recovery:'+hash

	rclient.multi([
		['set', key, user._id],
		['expire', key, 30*60*60], // Give the user 30 min.
	]).exec(function (err, replies) {
		if (err) {
			throw err
		}
		mail.send(mail.Templates.AccountRecovery(user, link),
			(err, result) => {
				cb(err);
		})
	})

}