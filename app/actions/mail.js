
"use strict"

var nconf = require("nconf")
var _sendgrid = require("sendgrid")
var please = require("app/lib/please")
var mongoose = require("mongoose")
var lodash = require("lodash")

var sendgrid = _sendgrid(
  nconf.get("SENDGRID_USERNAME"),
  nconf.get("SENDGRID_PASSWORD")
)

var User = mongoose.model("User")

module.exports.Templates = {
  AccountRecovery: function (user, link) {
    please({$model:User}, '$skip', arguments)

    var template = lodash.template(
      `<p>Oi, <%= user.name.split(' ')[0] %></p>
      <p>
        Para restorar acesso à sua conta, acesse esse link: <a href="<%= link %>"><%= link %></a>
      </p>
      <p>
        Você recebeu esse email pois recebemos um pedido de recuperação da sua conta. Se não foi você que fez o pedido, pode ignorar esse email. Nada de mal vai acontecer.
      </p>
      <p>
        Abraços.<br />
        Fabrica
      </p>`
    );

    return {
        to: user.email,
        subject: 'Recuperação de conta · Fabrica DeltaThinkers',
        html: template({ user: user, link: link })
    }
  }
}

var sendMessage = (data, cb) => {
  var payload = {
    to: undefined,
    subject: undefined,
    html: undefined,
    fromname: "Fabrica DeltaThinkers",
    from: "fabrica@deltathinkers.com",
  }

  lodash.extend(payload, data)

  console.log(payload)

  for (var i in payload) {
    if (typeof payload[i] === "undefined") {
      throw "Found undefined attribute in email payload."
    }
  }

  sendgrid.send(payload, cb)
}

module.exports.sendMessage = sendMessage



module.exports.toNewSellerClient = function (seller, client, cb) {
  please({$is:User}, {$is:User}, "$isFn", arguments)

}