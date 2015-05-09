
"use strict";

var nconf = require("nconf")
var _sendgrid = require("sendgrid")
var please = require("app/lib/please")
var mongoose = require("mongoose")

var sendgrid = _sendgrid(
  nconf.get("SENDGRID_USERNAME"),
  nconf.get("SENDGRID_PASSWORD")
)

var User = mongoose.model("User")

var sendMessage = (to, message) => {
  var template = `${message}`;

  sendgrid.send({
    from: "fabrica@deltathinkers.com",
    to: to,
    html: template,
  })
}

module.exports.toNewSellerClient = function (seller, client, cb) {
  please({$is:User}, {$is:User}, "$isFn");

  // sendMessage()
  // sendgrid
}