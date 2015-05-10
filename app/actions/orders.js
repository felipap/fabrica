
var mongoose = require('mongoose')
var please = require('app/lib/please')
var TMERA = require('app/lib/tmera')

var User = mongoose.model('User')
var Company = mongoose.model('Company')
var Order = mongoose.model('Order')
var logger = global.logger.mchild()

module.exports.register = function (self, data, cb) {
	please({$model:User}, '$skip', '$isFn')

	var order = new Order({
		comments: data.comments,
		name: data.name,
		color: data.color,
		seller: self._id,
		s3_path: data.file,
	})

	order.save(TMERA((doc) => {
		cb(null, doc)
	}))
}