
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')
var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')

var QueueCol = Models.Queue;

var ReactBackbone = require('react.backbone')

var PrintItem = React.createBackboneClass({

	render: function() {
		return (
			<div>
				oi, eu sou um modelo!
			</div>
		);
	}

});

var PrintQueue = React.createBackboneClass({
	render: function() {
		var self = this;

		function renderCollection() {
			if (self.getCollection().isEmpty()) {
				return (
					<div className="list is-empty">
						<h1>Seus pedidos vão aparecer aqui</h1>
					</div>
				);
			} else {
				var pitems = self.getCollection().map(function (m) {
					return <PrintItem model={m} />
				});
				return (
					<div className="list">
						{ pitems }
					</div>
				);
			}
		}

		return (
			<div className="PrintQueue">
				{renderCollection()}
			</div>
		);
	}
});

module.exports = function (app) {
	var queue = new QueueCol();

	app.pushPage(<PrintQueue collection={queue} />, 'home', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'home',
	})
};
