
async = require('async')
mongoose = require('mongoose')
_ = require('lodash')


jobber = require('../lib/jobber.js')((e) ->
  # redis = require 'app/config/redis'
  User = mongoose.model 'User'

  User.find {}, (err, docs) ->
    async.map docs, ((user, next) ->
      console.log(user)
      if not user.flags.seller and not user.flags.admin
        user.flags.seller = false
        user.flags.admin = false
        user.save(next)
      else
        next()
    ), (err, results) ->
      e.quit()

  # workUser = (user, done) ->

  # targetUserId = process.argv[2]
  # if targetUserId
  #   User.findOne { _id: targetUserId }, (err, user) ->
  #     workUser user, e.quit
  # else
  #   console.warn 'No target user id supplied. Doing all.'
  #   User.find {}, (err, users) ->
  #     async.map users, workUser, e.quit
).start()