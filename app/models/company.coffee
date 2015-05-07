
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'
jobs = require 'app/config/kue.js'
please = require 'app/lib/please.js'
redis = require 'app/config/redis.js'

################################################################################
## Schema ######################################################################

CompanySchema = new mongoose.Schema {
	name:					{ type: String, required: true }
	username:			{ type: String, required: true, index: true, unique: true }

	facebook_id:	{ type: String, required: true, index: true }
	email:				{ type: String }
	avatar_url:		{ type: String }

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

CompanySchema.statics.APISelect = ''

CompanySchema.plugin(require('./lib/hookedModelPlugin'))
CompanySchema.plugin(require('./lib/trashablePlugin'))
CompanySchema.plugin(require('./lib/fromObjectPlugin'))
CompanySchema.plugin(require('./lib/selectiveJSON'), CompanySchema.statics.APISelect)

module.exports = CompanySchema