
"use strict"

var nconf = require("nconf")
var _sendgrid = require("sendgrid")
var mongoose = require("mongoose")
var lodash = require("lodash")
var please = require("app/lib/please")

var sendgrid = _sendgrid(
  nconf.get("SENDGRID_USERNAME"),
  nconf.get("SENDGRID_PASSWORD")
)

var User = mongoose.model("User")
var Order = mongoose.model("Order")

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
  },
  NewSellerAccount: function (user) {
    please({$model:User}, arguments)

    var template = lodash.template(
      `<p>Olá, <%= user.name.split(' ')[0] %></p>
      <p>
        Você se registrou com sucesso na Fábrica DeltaThinkers, um site para impressão remota de...
      </p>
      <p>
        Imprima e exponha o cartaz da DeltaThinkers na sua loja: linkdocartazasd.
      </p>
      <p>
        Qualquer dúvida bla bla bla.<br />
      </p>`
    );

    return {
      to: user.email,
      subject: 'Bem-vindo à Fábrica DeltaThinkers',
      html: template({ user: user })
    }
  },
  NewOrderFromVendor: function (client, order, seller) {
    please({$model:User}, {$model:Order}, {$model:User}, arguments)

    var template = lodash.template(
      `<p>Olá, <%= client.name.split(' ')[0] %></p>
      <p>
        Registramos o pedido de impressão do seu modelo <%= order.name %> com na loja NOME DA LOJA
      </p>
      <p>
        Você pode acompanhar o andamento da impresão no link:
        <a href="http://app.deltathinkers.com/<%= order.link %>">
        http://app.deltathinkers.com/<%= order.link %></a>.
      </p>
      <p>
        Qualquer dúvida bla bla bla.<br />
      </p>`
    );

    return {
      to: client.email,
      subject: 'Pedido registrado na Fábrica DeltaThinkers',
      html: template({ client: client, order: order, seller: seller })
    }
  },

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

  for (var i in payload) {
    if (typeof payload[i] === "undefined") {
      throw "Found undefined attribute in email payload."
    }
  }

  sendgrid.send(payload, cb)
}

module.exports.send = sendMessage


module.exports.toNewSellerClient = function (seller, client, cb) {
  please({$is:User}, {$is:User}, "$isFn", arguments)

}