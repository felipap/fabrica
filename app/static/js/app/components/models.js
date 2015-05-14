
var Backbone = require('backbone');

var Order = Backbone.Model.extend({
  urlRoot: '/api/orders',
  initialize: function() {
    // Collection display stuff.
    // Perhaps this shouldn't be here.
    this.selected = 0;
  },

  select: function() {
    this.selected = 1;
    this.trigger('selectChange');
  },

  unselect: function() {
    this.selected = 0;
    this.trigger('selectChange');
  },

  getTitle: function() {
    return this.get('name');
  },
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
});

var OrderList = Backbone.Collection.extend({
  model: Order,
  url: '/api/orders',
  constructor: function() {
    Backbone.Collection.apply(this, arguments);
    this.selected = 0;
    this.on('selectChange', () => {
      var allNull = allTrue = true;
      this.map(function(model) {
        if (model.selected) {
          allNull = false;
        } else {
          allTrue = false;
        }
      });

      if (allNull) {
        this.selected = 0;
      } else if (allTrue) {
        this.selected = 1;
      } else {
        this.selected = 2; // = SOME are selected
      }
    })
  },

  getNumSelected: function() {
    var c = 0;
    this.map(function(i) {
      if (i.selected) c++;
    });
    return c;
  },

  getSelected: function() {
    return this.filter(function(i) {
      return i.selected;
    });
  },

  comparator: function(i) {
    console.log(1*new Date(i.get('created_at')))
    return -1*new Date(i.get('created_at'));
  },

  select: function() {
    this.map(function(model) {
      model.select();
    });
  },

  unselect: function() {
    this.map(function(model) {
      model.unselect();
    });
  },
})

module.exports = {
	Queue: Queue,
  Order: Order,
  OrderList: OrderList,
  Client: Client,
  ClientList: ClientList,
}