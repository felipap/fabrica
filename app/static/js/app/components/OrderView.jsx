
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var STLRenderer = require('../components/STLRenderer.jsx')

require('react.backbone')

var OrderView = React.createBackboneClass({
  getTitle: function() {
    return this.getModel().get('name');
  },

  render: function() {
    var doc = this.getModel().attributes;

    return (
      <div className="OrderView">
        <div className="row">
          <div className="col-md-8">
            <div className="name">
              {doc.name}
            </div>
            <div className="comments">
              {doc.comments}
            </div>
          </div>
          <div className="col-md-4 renderer">
            <STLRenderer ref="renderer" file={this.getModel().get('file')} />
          </div>
        </div>
      </div>
    );
  }
})

module.exports = OrderView;