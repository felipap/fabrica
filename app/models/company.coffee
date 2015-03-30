
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
	access_token: { type: String, required: true }
	facebook_id:	{ type: String, required: true, index: true }
	email:				{ type: String }
	avatar_url:		{ type: String }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

CompanySchema.statics.APISelect = ''

CompanySchema.statics.APISelectSelf = ''

################################################################################
## Virtuals ####################################################################

CompanySchema.methods.getCacheField = (field) ->
	# WTF, I feel like this is unnecessary... use only CacheFields?
	if field of CompanySchema.statics.CacheFields
		return CompanySchema.statics.CacheFields[field].replace('{id}', @id)
	else
		throw new Error("Field #{field} isn't a valid user cache field.")

CompanySchema.statics.CacheFields = {
}

################################################################################
## Middlewares #################################################################

# Useful inside templates
CompanySchema.methods.toSelfJSON = () ->
	@toJSON({
		virtuals: true
		select: CompanySchema.statics.APISelectSelf
	})

CompanySchema.plugin(require('./lib/hookedModelPlugin'))
CompanySchema.plugin(require('./lib/trashablePlugin'))
CompanySchema.plugin(require('./lib/fromObjectPlugin'))
CompanySchema.plugin(require('./lib/selectiveJSON'), CompanySchema.statics.APISelect)

module.exports = CompanySchema