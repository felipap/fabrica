
var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')


var jobber = require('../lib/jobber.js')((e) => {
  mail = require('app/actions/mail')
  userActions = require('app/actions/users')

  User = mongoose.model('User')
  User.findOne({ email: 'pires.a.felipe@gmail.com' }, (err, doc) => {
    userActions.initiateAccountRecovery(doc, () => {
      console.log(arguments)
    })
  })
}).start()