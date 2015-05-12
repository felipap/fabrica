
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')

require('react.backbone')

var OrderView = React.createBackboneClass({
  render: function() {
    return (
      <div className="FullOrderView">
        <div className="renderer">
        </div>
      </div>
    );
  }
})

module.exports = OrderView;