
var Backbone = require('backbone');

var Order = Backbone.Model.extend({
  urlRoot: '/api/orders',
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

var OrderList = Backbone.Collection.extend({
  model: Order,
  url: '/api/orders',
})

module.exports = {
	Queue: Queue,
  Order: Order,
  OrderList: OrderList,
  Client: Client,
  ClientList: ClientList,
}