
mongoose = require 'mongoose'
_ = require 'lodash'

Status = {
	Requested: 'requested'
	Processing: 'processing'
	Shipping: 'shipping'
	Done: 'done'
}

OrderSchema = new mongoose.Schema {
	status:			{ type: String, enum: _.values(Status), default: Status.Requested }
	comments: 	{ type: String, required: false }
	name: 			{ type: String }
	code: 			{ type: String, required: true }

	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }

	s3_path: 		{ type: String, required: false }

	client: 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	clerk:	 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	vendor: 		{ type: mongoose.Schema.ObjectId, ref: 'Company' }

	color: 			{ type: String }
	name: 			{ type: String }

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

OrderSchema.statics.APISelect = '-password'


OrderSchema.virtual('_cor').get ->
	{
		red: 'vermelho',
		green: 'verde',
		azul: 'azul',
	}[@color]

OrderSchema.virtual('_tipo').get ->
	'PLA'

OrderSchema.virtual('path').get ->
	'/pedidos/'+@id

OrderSchema.virtual('link').get ->
	'/pedidos/'+@code

OrderSchema.statics.ParseRules = {
	color:
		$valid: (str) -> true
	client:
		id:
			$valid: (str) ->
				try
					id = mongoose.Types.ObjectId.createFromHexString(str)
					return true
				catch e
					return false
	file:
		$valid: (str) ->
			# str.match(/^https:\/\/s3-sa-east-1\.amazonaws\.com\/deltathinkers\/jobs\/[a-z0-9-]+$/)
			str.match(/^https:\/\/deltathinkers\.s3\.amazonaws\.com\/jobs\/[a-z0-9-]+$/)
	comments:
		$valid: (str) -> true
	name:
		$valid: (str) -> true
}

OrderSchema.plugin(require('./lib/hookedModelPlugin'))
OrderSchema.plugin(require('./lib/trashablePlugin'))
OrderSchema.plugin(require('./lib/fromObjectPlugin'))
OrderSchema.plugin(require('./lib/selectiveJSON'), OrderSchema.statics.APISelect)

module.exports = OrderSchema