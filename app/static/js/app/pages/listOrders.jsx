
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')

require('react.backbone')



var ListOrders = React.createBackboneClass({

	render: function() {
		var orderList = this.getCollection().map(function (i) {
			console.log('ele', i.attributes)
			return (
				<li className="orderItem">
					<ul className="">
						<li className="selection">
							<PrettyCheck />
						</li>
						<li className="info">
							<div className="name">
								{i.get('name')}
							</div>
							<div className="comment">
								{i.get('comment')}
							</div>
						</li>
						<li className="stats">
							<div className="total">
								3 Pedidos
							</div>
							<div className="ago">
								Último pedido há 3 dias
							</div>
						</li>
						<li className="renderer">
						</li>
					</ul>
					<ul className="right">
						<li className="buttons">
							<button>The</button>
						</li>
					</ul>
				</li>
			);
		});
		return (
			<div className="ListOrders">
				<h1>
					Seus pedidos
				</h1>
				<p>
					Lista organizada por pedidos mais recentes.
				</p>
				<ul className="orderList">
					{orderList}
				</ul>
			</div>
		);
	}
});

module.exports = function(app) {
	var collection = new Models.OrderList();
	collection.fetch();
	app.pushPage(<ListOrders collection={collection} />, 'list-orders', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'list-orders',
	});
};
