
"use strict";

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')

require('react.backbone')

var ListClients = React.createBackboneClass({

	render: function() {
		var clientList = this.getCollection().map(function (i) {
			console.log('ele', i.attributes)
			return (
				<li className="clientItem">
					<ul className="">
						<li className="selection">
							<PrettyCheck />
						</li>
						<li className="picture">
							<div className="user-avatar">
								<div className="avatar" style={{backgroundImage: 'url(\''+i.get('picture')+'\')'}} />
							</div>
						</li>
						<li className="info">
							<div className="name">
								{i.get('name')}
							</div>
							<div className="email">
								{i.get('email')}
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
			<div className="ListClients">
				<h1>
					Seus clientes
				</h1>
				<p>
					Lista organizada por pedidos mais recentes.
				</p>
				<ul className="clientList">
					{clientList}
				</ul>
			</div>
		);
	}
});

module.exports = function(app) {
	var collection = new Models.ClientList();
	collection.fetch();
	app.pushPage(<ListClients collection={collection} />, 'list-clients', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'list-clients',
	});
};
