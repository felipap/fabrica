
var mongoose = require('mongoose')
var crypto = require('crypto')

var please = require('app/lib/please')
var TMERA = require('app/lib/tmera')
var mail = require('app/actions/mail')

var User = mongoose.model('User')
var Company = mongoose.model('Company')
var Order = mongoose.model('Order')

var logger = global.logger.mchild()

// http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
function randomValueBase64 (len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')   // convert to base64 format
		.slice(0, len)        // return required number of characters
		.replace(/\+/g, '0')  // replace '+' with '0'
		.replace(/\//g, '0'); // replace '/' with '0'
}

module.exports.place = function (seller, client, data, cb) {
	please({$model:User}, {$model:User}, '$skip', '$isFn')

	var order = new Order({
		comments: data.comments,
		name: data.name,
		client: data.client.id,
		color: data.color,
		vendor: seller._id,
		code: randomValueBase64(10),
		file: data.file,
	})

	order.save(TMERA((doc) => {
		mail.send(mail.Templates.NewOrderFromVendor(client, order, seller),
			(err, result) => {
				if (err) {
					throw err
				}
		})

		cb(null, doc)
	}))
}

module.exports.update = function (seller, order, data, cb) {
	please({$model:User}, {$model:Order}, '$skip', '$isFn')

	console.log('update', data)

	if (data.status) {
		order.status = data.status
	}

	order.save(TMERA((doc) => {
		cb(null, doc)
	}))


	// var order = new Order({
	// 	comments: data.comments,
	// 	name: data.name,
	// 	client: data.clientId,
	// 	color: data.color,
	// 	seller: seller._id,
	// 	code: randomValueBase64(10),
	// 	file: data.file,
	// })

	// order.save(TMERA((doc) => {
	// 	mail.send(mail.Templates.NewOrderFromVendor(client, order, seller),
	// 		(err, result) => {
	// 			cb(err);
	// 	})

	// 	cb(null, doc)
	// }))
}