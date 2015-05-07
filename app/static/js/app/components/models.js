
var Backbone = require('backbone');

var PrintJob = Backbone.Model.extend({

});

var Queue = Backbone.Collection.extend({
  item: PrintJob,
});

module.exports = {
	Queue: Queue,
  PrintJob: PrintJob,
}