
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')

require('react.backbone')

window.formatOrderDate = function (date) {
	date = new Date(date);
	return ''+date.getDate()+' de '+['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
	'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
	'Dezembro'][date.getMonth()]+', '+date.getFullYear()+' '+(date.getHours()>12?
		''+(date.getHours()-12)+':'+date.getMinutes()+'pm':
		''+(date.getHours())+':'+date.getMinutes()+'am');
};

var FullOrderView = React.createBackboneClass({
	render: function() {
		return (
			<div className="FullOrderView">
				<div className="renderer">
				</div>
			</div>
		);
	}
})


var OrderItem = React.createBackboneClass({
	getInitialState: function() {
		return {
			expanded: false,
		}
	},

	render: function() {
		var doc = this.getModel();

		var goto = () => {
			app.navigate(i.path, { trigger: true });
		}

		return (
			<tr className="item" onClick={goto}>
				<td className="selection">
					<PrettyCheck />
				</td>
				<td className="name">
					{doc.get('name')}
				</td>
				<td className="type">
					{doc.get('_cor')[0].toUpperCase()+doc.get('_cor').slice(1)}/{doc.get('_tipo')}
				</td>
				<td className="ctdent">
					Mauro Iezzi
				</td>
				<td className="stats">
					Avatdado<br />Aguardando Impressão
				</td>
				<td className="elastic"></td>
				<td className="date">
					<span data-time-count={doc.get('created_at')} data-title={formatOrderDate(doc.get('created_at'))}>
						{calcTimeFrom(doc.get('created_at'))}
					</span>
				</td>
			</tr>
		);
	},
});

var ListOrders = React.createBackboneClass({

	render: function() {
		var GenerateOrderList = () => {
			return this.getCollection().map(function (i) {
				return <OrderItem model={i} />
			});
		};

		var GenerateHeader = () => {
			return (
				<thead className="header">
					<tr>
						<th className="selection">
						</th>
						<th className="name">
							Indetificação
						</th>
						<th className="type">
							Tipo
						</th>
						<th className="cthent">
							Cliente
						</th>
						<th className="stats">
							Status
						</th>
						<th className="elastic"></th>
						<th className="date">
							Data
						</th>
					</tr>
				</thead>
			);
		};

		var GenerateToolbar = () => {
			return (
				<div className="toolbar">
					<ul>
						<li>
						</li>
					</ul>
					<ul className="right">
						<li>
							<button className="btn btn-danger">
								Excluir tudo
							</button>
						</li>
					</ul>
				</div>
			);
		};


		return (
			<div className="ListOrders">
				<h1>
					Seus pedidos
				</h1>
				<p>
					Lista organizada por pedidos mais recentes.
				</p>
				<div className="orderList">
					{GenerateToolbar()}
					<table>
						{GenerateHeader()}
						{GenerateOrderList()}
					</table>
				</div>
			</div>
		);
	}
});

module.exports = function(app) {
	var collection = new Models.OrderList();

	collection.fetch();
	window.c = collection;

	app.pushPage(<ListOrders collection={collection} />, 'list-orders', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'list-orders',
	});
};
