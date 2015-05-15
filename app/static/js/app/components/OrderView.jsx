
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

    var GenClientField = () => {
      var client = doc.client;
      return (
        <div className="field userField">
          <label>
            Cliente
          </label>
          <div className="value">
            <div className="name">
              {client.name}
            </div>
            <div className="email">
              {client.email}
            </div>
            <div className="phone">
              {client.phone}
            </div>
          </div>
        </div>
      );
    };

    var GenVendorField = () => {
      var vendor = doc.vendor;
      return (
        <div className="field userField">
          <label>
            Vendedor
          </label>
          <div className="value">
            <div className="name">
              {vendor.name}
            </div>
            <div className="email">
              {vendor.email}
            </div>
            <div className="phone">
              {vendor.phone}
            </div>
          </div>
        </div>
      );
    };


    var GenStatusField = () => {
      var GenStatusIcon = () => {
        if (doc.status === "shipping") {
          return <i className="icon-send" />;
        } else if (doc.status === "waiting") {
          return <i className="icon-timer" />;
        } else if (doc.status === "processing") {
          return <i className="icon-details" />;
        } else if (doc.status === "cancelled") {
          return <i className="icon-close" />;
        } else if (doc.status === "late") {
          return <i className="icon-timer" />;
        } else if (doc.status === "done") {
          return <i className="icon-done-all" />;
        }
      };

      return (
        <div className="field statusField">
          <label>
            Status
          </label>
          <div className="btn-group">
            <button type="button" className="btn btn-default dropdown-toggle"
              data-status={doc.status}
              data-toggle="dropdown" aria-expanded="false">
              {GenStatusIcon()} {doc._status}
              &nbsp;<span className="caret"></span>
            </button>
            <ul className="dropdown-menu" role="menu">
              <li><a href="#">Action</a></li>
              <li><a href="#">Another action</a></li>
              <li><a href="#">Something else here</a></li>
              <li className="divider"></li>
              <li><a href="#">Separated link</a></li>
            </ul>
          </div>
        </div>
      );
    };

    var GenTypeField = () => {
      return (
        <div className="field">
          <label>
            Configuração
          </label>
          <div className="value">
            {doc._cor[0].toUpperCase()+doc._cor.slice(1)} / {doc._tipo}
            </div>
        </div>
      )
    };

    var GenCommentField = () => {
      if (!doc.comments || doc.comments.match(/^\s*$/)) {
        return null;
      }

      return (
        <div className="field">
          <label>
            Comentário do Pedido
          </label>
          <textarea name="comments" className="value comments"
            disabled={true} defaultValue={doc.comments}>
          </textarea>
        </div>
      )
    };

    var GenDateField = () => {
      return (
        <div className="field">
          <label>
            Data
          </label>
          <div className="value">
            {formatOrderDate(doc.created_at)}
          </div>
        </div>
      )
    };

    return (
      <div className="OrderView">
        <div className="row">
          <div className="col-md-7">
            <div className="orderFields">
              <div className="field">
                <label>
                  Nome
                </label>
                <input type="text" name="name" className="value name"
                  disabled={true} defaultValue={doc.name} />
              </div>
              {GenCommentField()}
              {GenTypeField()}
              <div className="row">
                <div className="col-md-6">
                  {GenDateField()}
                </div>
                <div className="col-md-4">
                  {GenStatusField()}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  {GenClientField()}
                </div>
                <div className="col-md-6">
                  {GenVendorField()}
                </div>
              </div>
            </div>
            <a className="button download" target="_blank" href={this.getModel().get('file')}>
              Acessar Arquivo
            </a>
          </div>
          <div className="col-md-5">
            <label>
              visualização
            </label>
            <STLRenderer ref="renderer" file={this.getModel().get('file')}
              color={doc.color} />
          </div>
        </div>
      </div>
    );
  }
})

module.exports = OrderView;