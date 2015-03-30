
mongoose = require 'mongoose'
async = require 'async'
_ = require 'lodash'
assert = require 'assert'

please = require 'app/lib/please'
Chunker = require './chunker'
logger = require('app/config/bunyan')(service: 'NotificationService')
TMERA = require 'app/lib/tmera'

Notification = mongoose.model 'Notification'
User = mongoose.model 'User'

# Instances are aggregated inside items, which are aggregated to form a
# notification chunk.

Templates = {
	'NewFollower': {
		aggregate: true
		instance: (data, agent) ->
			please {
				follow: { $model: 'Follow' }
				followee: { $model: 'User' }
			}

			return {
				path: agent.path
				key: 'newfollower:'+data.followee._id+':'+agent._id
				created_at: data.follow.created_at
				updated_at: data.follow.created_at
				object: {
					follow: data.follow._id
					name: agent.name
					avatarUrl: agent.avatarUrl
				}
			}
		item: (data) ->
			please {followee:{$model:'User'}}

			return {
				identifier: 'newfollower:'+data.followee._id
				resource: data.followee._id
				type: 'NewFollower'
				object: { }
				receiver: data.followee._id
				instances: []
			}
	}
	'Welcome': {
		aggregate: false
		item: (data) ->
			please { user: { $model: 'User' } }

			return {
				identifier: 'welcome:'+data.user.id
				type: 'Welcome'
				object: {
					userName: data.user.name
				}
				receiver: data.user._id
			}
	}
}

###*
 * Generators recreate notifications of a certain type for a certain user.
 * They must return via callback an array of notification objects.
###

Generators = {
	NewFollower: (user, cb) ->
		logger = logger.child({ generator: 'NewFollower' })
		Follow = mongoose.model('Follow')
		User = mongoose.model('User')

		Follow
			.find { 'followee': user._id }
			.populate { path: 'follower', model: User }
			.exec TMERA (docs) ->
				if docs.length is 0
					return cb(null, [])

				# console.log('docs', docs)
				instances = []
				skin = Templates.NewFollower.item({ followee: user })
				docs.forEach (follow) ->
					# Get unpopulated follow
					ofollow = new Follow(follow)
					ofollow.follower = follow.follower._id
					data = { follow: ofollow, followee: user }
					instances.push(Templates.NewFollower.instance(data, follow.follower))
				# console.log("INSTANCES",instances)
				oldest = _.min(instances, 'created_at')
				latest = _.max(instances, 'created_at')
				cb(null, [new Notification(_.extend(skin, {
					instances: instances
					multiplier: instances.length
					updated_at: latest.created_at
					created_at: oldest.created_at # Date of the oldest follow
				}))])
	Welcome: (user, cb) ->
		skin = Templates.Welcome.item({ user: user })
		notification = new Notification(_.extend(skin, {
			instances: null
			updated_at: user.meta.created_at
			created_at: user.meta.created_at
		}))
		cb(null, [notification])
}

class NotificationService

	Handler: Templates
	Types: Notification.Types

	create: (agent, type, data, cb = () ->) ->

		onAdded = (err, chunk, object, instance) ->
			if err
				throw new Error("CARALGHO")
			if not chunk
				return cb(null)
			User.findOneAndUpdate { _id: object.receiver },
			{ 'meta.last_received_notifications': Date.now() }, (err, doc) ->
				if err
					logger.error("Failed to update user meta.last_received_notifications")
					throw err
				logger.info("User %s(%s) meta.last_received_notifications updated",
					doc.name, doc.id)
				cb(null)

		chunker.add(agent, type, data, onAdded)

	undo: (agent, type, data, cb = () ->) ->

		onRemovedAll = (err, object, object_inst, count) ->
			cb(err)

		chunker.remove(agent, type, data, onRemovedAll)

	redoUserNotifications: (user, cb) ->

		chunker.redoUser user, (err, chunk) ->
			console.log('chunk')

			User.findOneAndUpdate {
 				_id: user._id
 			}, {
 				'meta.last_received_notifications': chunk.updated_at
 			}, (err, doc) ->
 				cb()

module.exports = new NotificationService