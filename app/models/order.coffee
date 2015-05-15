
mongoose = require 'mongoose'
_ = require 'lodash'


Status = ["shipping", "waiting", "processing", "cancelled", "late", "done"]

OrderSchema = new mongoose.Schema {
	status:			{ type: String, enum: Status, default: Status.Requested }
	comments: 	{ type: String, required: false }
	name: 			{ type: String, required: true }
	code: 			{ type: String, required: true }

	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }

	file: 		{ type: String, required: false }

	client: 		{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	vendor: 		{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }

	color: 			{ type: String, required: true }

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

OrderSchema.statics.APISelect = '-password'

OrderSchema.statics.Status = {}
Status.forEach (s) ->
	OrderSchema.statics.Status[s[0].toUpperCase()+s.slice(1)] = s;

OrderSchema.virtual('_cor').get ->
	{
		red: 'vermelho',
		green: 'verde',
		azul: 'azul',
	}[@color]

OrderSchema.virtual('_status').get ->
	{
		shipping: "pronto"
		waiting: "esperando"
		processing: "imprimindo"
		cancelled: "cancelado"
		late: "atrasado"
		done: "enviado"
	}[@status]

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

OrderSchema.statics.UpdateParseRules = {
	_id:
		$valid: (str) ->
			try
				mongoose.Types.ObjectId.createFromHexString(str)
				return true
			catch e
				return false
	color:
		$valid: (str) -> true
	status:
		$valid: (str) -> Status.indexOf(str) isnt -1
	name:
		$valid: (str) -> true
}

OrderSchema.plugin(require('./lib/hookedModelPlugin'))
OrderSchema.plugin(require('./lib/trashablePlugin'))
OrderSchema.plugin(require('./lib/fromObjectPlugin'))
OrderSchema.plugin(require('./lib/selectiveJSON'), OrderSchema.statics.APISelect)

module.exports = OrderSchema
