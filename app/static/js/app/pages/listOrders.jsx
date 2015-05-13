
"use strict"

var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PrettyCheck = require('../components/PrettyCheck.jsx')
var OrderView = require('../components/OrderView.jsx')

require('react.backbone')

window.formatOrderDate = function (date) {
	date = new Date(date);
	return ''+date.getDate()+' de '+['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
	'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro',
	'Dezembro'][date.getMonth()]+', '+date.getFullYear()+' '+(date.getHours()>12?
		''+(date.getHours()-12)+':'+date.getMinutes()+'pm':
		''+(date.getHours())+':'+date.getMinutes()+'am');
};

var OrderItem = React.createBackboneClass({
	getInitialState: function() {
		return {
			expanded: false,
		}
	},

	render: function() {
		var doc = this.getModel().attributes;

		var goto = () => {
			// app.navigate(i.path, { trigger: true });
			this.props.toggle();
		}

		return (
			<tr className="item" onClick={goto}>
				<td className="selection">
					<PrettyCheck />
				</td>
				<td className="name">
					{doc.name}
				</td>
				<td className="type">
					{doc._cor[0].toUpperCase()+doc._cor.slice(1)}/{doc._tipo}
				</td>
				<td className="ctdent">
					Mauro Iezzi
				</td>
				<td className="stats">
					Avatdado<br />Aguardando Impressão
				</td>
				<td className="elastic"></td>
				<td className="date">
					<span data-time-count={doc.created_at} data-title={formatOrderDate(doc.created_at)}>
						{calcTimeFrom(doc.created_at)}
					</span>
				</td>
			</tr>
		);
	},
});

var ListOrders = React.createBackboneClass({

	getInitialState: function () {
		return {
			expanded: null,
		}
	},


	render: function() {
		var GenerateOrderList = () => {
			var collection = this.getCollection();
			var rows = [];
			var i = 0;
			window.c = collection;
			while (i < collection.length) {
				!((i) => {
					var toggle = () => {
						if (this.state.expanded === i) {
							this.setState({ expanded: null });
						} else {
							this.setState({ expanded: i });
						}
					};

					// Hack: add expanded item as table row with a single colum
					rows.push(<OrderItem model={collection.at(i)} toggle={toggle} />)
					if (this.state.expanded === i) {
						rows.push((
							<li className="order">
								<td colSpan="100">
									<OrderView model={collection.at(i)} />
								</td>
							</li>
						))
					}
				})(i);
				++i;
			}
			return rows;
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
				<div className="listToolbar">
					<ul>
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
				<div className="left">
					<h1>
						Pedidos
					</h1>
				</div>
				<div className="right">
					<a className="button newOrder" href="/novo/pedido">
						Novo Pedido
					</a>
				</div>
				{GenerateToolbar()}
				<div className="orderList">
					{GenerateOrderList()}
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
