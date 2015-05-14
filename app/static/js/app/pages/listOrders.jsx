
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

		var GenStatusIcon = () => {
			if (doc.status === "shipping") {
	      return (
	      	<div className="statusIcon shipping" title="shipping">
	      		<i className="icon-send" />
	      	</div>
	      );
			} else if (doc.status === "requested") {
	      return (
	      	<div className="statusIcon requested" title="requested">
	      		<i className="icon-timer" />
	      	</div>
	      );
			} else if (doc.status === "processing") {
	      return (
	      	<div className="statusIcon processing" title="processing">
	      		<i className="icon-details" />
	      	</div>
	      );
			} else if (doc.status === "cancelled") {
	      return (
	      	<div className="statusIcon cancelled" title="cancelled">
	      		<i className="icon-close" />
	      	</div>
	      );
			} else if (doc.status === "late") {
	      return (
	      	<div className="statusIcon late" title="late">
	      		<i className="icon-timer" />
	      	</div>
	      );
			} else {
	      return (
	      	<div className="statusIcon done" title="done">
	      		<i className="icon-done-all" />
	      	</div>
	      );
			}
		};

		return (
			<li className="order" onClick={goto}>
				<div className="left">
					<div className="selection">
						<PrettyCheck ref="check" model={this.getModel()} />
					</div>
					{GenStatusIcon()}
				</div>
				<div className="main">
					<div className="name">
						{doc.name}
						<div className="code" title="Código da peça.">
							({doc.code})
						</div>
					</div>
					<div className="type">
						Impressão 3D · {doc._cor[0].toUpperCase()+doc._cor.slice(1)}/{doc._tipo}
					</div>
					<div className="client">
						<strong>Cliente:</strong> <a href="#">Mauro Iezzi</a>, pela <a href="#">Gráfica do Catete</a>
					</div>
				</div>
				<div className="right">
					<div className="date">
						<span data-time-count={1*new Date(doc.created_at)} data-long="true" data-title={formatOrderDate(doc.created_at)}>
							{calcTimeFrom(doc.created_at)}
						</span>
					</div>
					<div className="buttons">
						<button>
							Editar
						</button>
					</div>
				</div>
			</li>
		);
	},
});

var Toolbar = React.createBackboneClass({

  componentDidMount: function() {
    this.getCollection().on('selectChange', () => {
      this.forceUpdate(function () {});
    });
  },

	render: function() {

		console.log('not', this.getCollection())
		if (this.getCollection().selected) {
			var numSelected = this.getCollection().getNumSelected();
			var buttons = [];
			buttons.push((
				<li>
					<button>Excluir {numSelected} pedido{numSelected>1?"s":''}</button>
				</li>
			));
		}

		return (
			<div className="listToolbar">
				<ul>
					<li className="selection">
						<PrettyCheck model={this.getCollection()} />
					</li>
					{buttons}
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
				!((i) => { // create context for 'i'
					var toggle = () => {
						return;
						if (this.state.expanded === i) {
							this.setState({ expanded: null });
						} else {
							this.setState({ expanded: i });
						}
					};

					// Hack: add expanded item as table row with a single colum
					rows.push((
						<OrderItem model={collection.at(i)} toggle={toggle} />
					));
					if (this.state.expanded === i) {
						rows.push((
							<li className="order expanded">
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

		return (
			<div className="ListOrders">
				<div className="pageHeader">
					<div className="left">
						<h1>
							Pedidos
						</h1>
					</div>
					<div className="right">
						<a className="button newOrder" href="/pedidos/novo">
							Novo Pedido
						</a>
					</div>
				</div>
				<Toolbar parent={this} collection={this.getCollection()}/>
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
