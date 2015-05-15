
var mongoose = require('mongoose')
var required = require('../lib/required')

module.exports = function(app) {
  var router = require('express').Router()
  router.use(required.login)

  router.post('/logout', function(req, res) {
    req.logout()
    res.redirect('/')
  })

  return router
}