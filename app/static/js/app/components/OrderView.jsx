
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

    var GenClientBlock = () => {
      var client = doc.client;
      return (
        <div className="userDisplay">
          <label>
            Cliente
          </label>
          <div>
            <div className="left">
              <div className="user-avatar">
                <div className="avatar"
                  style={{backgroundImage:'url('+client.picture+')'}} />
              </div>
            </div>
            <div className="right">
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
        </div>
      );
    };

    var GenVendorBlock = () => {
      var vendor = doc.vendor;
      return (
        <div className="userDisplay">
          <label>
            Vendedor
          </label>
          <div>
            <div className="left">
              <div className="user-avatar">
                <div className="avatar"
                  style={{backgroundImage:'url('+vendor.picture+')'}} />
              </div>
            </div>
            <div className="right">
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
        </div>
      );
    };

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
              <div className="field">
                <label>
                  Comentário do Pedido
                </label>
                <textarea name="comments" className="value comments"
                  disabled={true} defaultValue={doc.comments}>
                </textarea>
              </div>
              <div className="field">
                <label>
                  Configuração
                </label>
                <div className="value">
                  {doc._cor[0].toUpperCase()+doc._cor.slice(1)} · {doc._tipo}
                  </div>
              </div>
              <div className="row">
                <div className="col-md-7">
                  <div className="field">
                    <label>
                      Data
                    </label>
                    <div className="value">
                      {formatOrderDate(doc.created_at)}
                      (<span data-time-count={1*new Date(doc.created_at)} data-short="false" data-title={formatOrderDate(doc.created_at)}>
                      {calcTimeFrom(doc.created_at)}
                      </span>)
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="field statusField">
                    <label>
                      Status
                    </label>
                    <div className="value" data-status={doc.status}>
                      {GenStatusIcon()} {doc._status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="field">
                    {GenClientBlock()}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="field">
                    {GenVendorBlock()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <h2>
              visualização
            </h2>
            <STLRenderer ref="renderer" file={this.getModel().get('file')}
              color={doc.color} />
            <a className="button download" target="_blank" href={this.getModel().get('file')}>
              Acessar Arquivo
            </a>
          </div>
        </div>
      </div>
    );
  }
})

module.exports = OrderView;