
mongoose = require 'mongoose'
_ = require 'lodash'
async = require 'async'
jobs = require 'app/config/kue.js'
please = require 'app/lib/please.js'
redis = require 'app/config/redis.js'
bcrypt = require 'bcrypt'
crypto = require 'crypto'

################################################################################
## Schema ######################################################################

SALT_WORK_FACTOR = 10

UserSchema = new mongoose.Schema {
	name:					{ type: String, required: true }
	# username:			{ type: String, required: true, index: true, unique: true }
	# access_token: { type: String, required: true }
	# facebook_id:	{ type: String, required: true, index: true }
	email:				{ type: String, required: true, unique: true, index: true }
	password:			{ type: String, required: true }
	avatar_url:		{ type: String }

	company: {
		id: 		{ type: String }
		name: 	{ type: String, default: 'DeltaThinkers' }
	}

	profile: {
		isStaff: 		{ type: Boolean, default: false }
		fbName: 		{ type: String }
		location:		{ type: String, default: '' }
		bio: 				{ type: String, default: ''}
		home: 			{ type: String, default: '' }
		background:	{ type: String, default: '/static/images/rio.jpg' }
		birthday:		{ type: Date }
	}

	stats: {
		votes:			{ type: Number, default: 0 }
	}

	meta: {
		registered: { type: Boolean, default: false }
		session_count: Number
		last_signin_ip: String
		current_signin_ip: String
		last_signin: { type: Date, default: Date.now }
		created_at: { type: Date, default: Date.now }
		updated_at: { type: Date, default: Date.now }
		last_access: { type: Date, default: Date.now }
		last_seen_notifications: { type: Date, default: 0 }
		last_received_notifications: { type: Date, default: 0 }
	}

	badges: [{
		# id: 123,
		# amount: 1,
		# first_received: { type: Data, default: Date.now }
		# last_received: { type: Data, default: Date.now }
	}]

	preferences: {
		fbNotifiable: { type: Boolean, default: true }
		labs: []
		subjects: []
	}

	# last_activity: { } # Use to prevent spam? → no, prevent spam with redis

	flags: {
		banned: false
		admin: false
		fake: false
		trust: 0
		mystique: false
		editor: false
	}

}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

UserSchema.statics.APISelect = 'id
	name
	username
	profile
	path
	avatar_url
	avatarUrl
	-slug
	-profile.serie
	-badges
	-profile.birthday'

UserSchema.statics.APISelectSelf = 'id
	name
	username
	profile
	path
	avatar_url
	avatarUrl
	meta.last_seen_notifications
	meta.last_received_notifications
	meta.last_access
	preferences.labs
	preferences.subjects
	flags
	-slug
	-profile.serie
	-profile.birthday'

################################################################################
## Virtuals ####################################################################

UserSchema.pre 'save', (next) ->
	user = @
	if not user.isModified('password')
		return next()
	bcrypt.genSalt SALT_WORK_FACTOR, (err, salt) ->
		if err
			return next(err)
		bcrypt.hash user.password, salt, (err, hash) ->
			if err
				return next(err)
			user.password = hash
			next()


UserSchema.methods.getCacheField = (field) ->
	# WTF, I feel like this is unnecessary... use only CacheFields?
	if field of UserSchema.statics.CacheFields
		return UserSchema.statics.CacheFields[field].replace('{id}', @id)
	else
		throw new Error("Field #{field} isn't a valid user cache field.")

UserSchema.statics.CacheFields = {
	Following: 'user:{id}:following'
	Followers: 'user:{id}:followers'
	Profile: 'user:{id}:profile'
}

UserSchema.virtual('picture').get ->
	hash = crypto.createHash('md5').update(@email).digest('hex')
	'http://www.gravatar.com/avatar/'+hash

UserSchema.virtual('path').get ->
	'/@'+@username

################################################################################
## Middlewares #################################################################

# Must bind to user removal the deletion of:
# - Follows (@=followee or @=follower)
# - Notification (@=agent or @=recipient)
# - Post (@=author)
# - Activity (@=actor)

# TODO! remove cached keys

# UserSchema.pre 'remove', (next) ->
# 	Notification = mongoose.model('Notification')
# 	Notification.find().or([{agent:@},{recipient:@}]).remove (err, docs) =>
# 		console.log "Removing #{err} #{docs} notifications related to #{@username}"
# 		next()

# UserSchema.pre 'remove', (next) ->
	# Activity.remove {actor:@}, (err, docs) =>
	# 	console.log "Removing #{err} #{docs} activities related to #{@username}"
	# 	next()

UserSchema.methods.usesPassword = (candidate, cb) ->
	console.log(@)
	bcrypt.compare candidate, @password, (err, isMatch) ->
		if err
			return cb(err)
		cb(null, isMatch)

UserSchema.methods.seeNotifications = (cb) ->
	User = mongoose.model('User')
	User.findOneAndUpdate { _id: @_id }, { 'meta.last_seen_notifications': Date.now() },
	(err, save) ->
		if err or not save
			console.log("EROOOOO")
			throw err
		cb(null)

UserSchema.methods.getNotifications = (limit, cb) ->
	self = @
	return cb(null, { items:[], last_seen: Date.now(), last_update: 0 })
	if @notification_chunks.length is 0
		return cb(null, { items: [], last_seen: Date.now() })
	# TODO: Use cache here if last_sent_notification < last_seen_notifications
	id = @notification_chunks[@notification_chunks.length-1]
	NotificationChunk = mongoose.model('NotificationChunk')
	NotificationChunk.findOne { _id: id }, (err, chunk) ->
		if err
			throw err # Programmer Error
		if not chunk
			return cb(null, {})
		itemsc = _.chain(chunk.toJSON().items)
							.filter (i) ->
								# Notification either doesn't accept instances or
								# has instances
								not i.instances or i.instances.length
							.sortBy((i) -> -i.updated_at)
							.map((i) ->
								if i.instances
									# Slice and sort by date created
									sorted = _.sortBy(i.instances.slice(0,limit), (i) -> -i.created_at)
									return _.extend(i, { instances: sorted })
								else
									return i
							)
							.value()
		cb(null, {
			items: itemsc
			last_seen: self.meta.last_seen_notifications
			last_update: chunk.updated_at
		})

UserSchema.methods.getKarma = (limit, cb) ->
	self = @
	if @karma_chunks.length is 0
		return cb(null, { items: [], last_seen: Date.now() })

	console.log('karma chunks size:', @karma_chunks.length)

	KarmaChunk = mongoose.model('KarmaChunk')
	KarmaChunk.findOne { _id: @karma_chunks[@karma_chunks.length-1] }, (err, chunk) ->
		if err
			throw err # Programmer Error
		if not chunk
			return cb(null, {})
		cb(null, {
			items: _.sortBy(chunk.toJSON().items, (i) -> -i.updated_at)
			last_seen: chunk.last_seen
			karma: self.stats.karma
		})

UserSchema.statics.AuthorSchema = {
		id: String
		username: String
		path: String
		avatarUrl: String
		name: String
	}

UserSchema.statics.toAuthorObject = (user) ->
	{
		id: user.id
		username: user.username
		path: user.path
		avatarUrl: user.avatarUrl
		name: user.name
	}

# Useful inside templates
UserSchema.methods.toSelfJSON = () ->
	@toJSON({
		virtuals: true
		select: UserSchema.statics.APISelectSelf
	})

validator = require 'validator'

UserSchema.statics.SingupParseRules = {
	name:
		$valid: (str) -> true
		$parse: validator.trim
	email:
		$valid: (str) ->
			validator.isEmail(str)
		$parse: validator.trim
	password1:
		$msg: "Entre uma senha com ao menos 5 caracteres."
		$valid: (str) ->
			validator.isLength(str, 5)
}

UserSchema.plugin(require('./lib/hookedModelPlugin'))
UserSchema.plugin(require('./lib/trashablePlugin'))
UserSchema.plugin(require('./lib/fromObjectPlugin'))
UserSchema.plugin(require('./lib/selectiveJSON'), UserSchema.statics.APISelect)

module.exports = UserSchema