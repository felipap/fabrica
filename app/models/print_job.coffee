
mongoose = require 'mongoose'
_ = require 'lodash'

Status = {
	Requested: 'requested'
	Processing: 'processing'
	Done: 'done'
}

PrintJob = new mongoose.Schema {
	status:			{ type: String, enum: _.values(Status), default: Status.Requested }
	comments: 	{ type: String, required: false }

	created_at: { type: Date, default: Date.now }
	updated_at: { type: Date, default: Date.now }

	s3_path: 		{ type: String, required: false }

	client: 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	clerk:	 		{ type: mongoose.Schema.ObjectId, ref: 'User' }
	vendor: 		{ type: mongoose.Schema.ObjectId, ref: 'Company' }

	identifier: { type: String, required: true } # Identifies actions of same nature
	resource:		{ type: mongoose.Schema.ObjectId, required: true }
	path:				{ type: String, required: false }
	object: 		{ } # name, thumbnail...
	instances: [{
		key: 			{ type: String, required: true }
		path: 		{ type: String, required: true }
		object: 	{ } # name, avatarUrl?
		created_at: { type: Date, default: Date.now, index: 1 }
		# _id:	false
	}]
	multiplier: { type: Number, default: 1 }

}

module.exports = PrintJob