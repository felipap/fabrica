
var mongoose = require('mongoose')
var please = require('app/lib/please')
var TMERA = require('app/lib/tmera')

var User = mongoose.model('User')
var Order = mongoose.model('Order')
var logger = global.logger.mchild()

module.exports.make = function (self, data, cb) {
	please({$model:User}, '$skip', '$isFn')
}
