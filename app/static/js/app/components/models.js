
var Backbone = require('backbone');

var Order = Backbone.Model.extend({
  urlRoot: '/api/printjobs',
});

var Client = Backbone.Model.extend({
  urlRoot: '/api/clients',
});

var Queue = Backbone.Collection.extend({
  model: Order,
});

var ClientList = Backbone.Collection.extend({
  model: Client,
  url: '/api/myclients',
})

module.exports = {
	Queue: Queue,
  Order: Order,
  Client: Client,
  ClientList: ClientList,
}