
var Backbone = require('backbone');

var PrintJob = Backbone.Model.extend({
  urlRoot: '/api/printjobs',
});

var Client = Backbone.Model.extend({
  urlRoot: '/api/clients',
});

var Queue = Backbone.Collection.extend({
  model: PrintJob,
});

var ClientList = Backbone.Collection.extend({
  model: Client,
  url: '/api/myclients',
})

module.exports = {
	Queue: Queue,
  PrintJob: PrintJob,
  Client: Client,
  ClientList: ClientList,
}