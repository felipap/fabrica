
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
        return (
          <div className="StatusIcon shipping" title="Pronto">
            <i className="icon-send" />
          </div>
        );
      } else if (doc.status === "waiting") {
        return (
          <div className="StatusIcon waiting" title="Esperando">
            <i className="icon-timer" />
          </div>
        );
      } else if (doc.status === "processing") {
        return (
          <div className="StatusIcon processing" title="Processando">
            <i className="icon-details" />
          </div>
        );
      } else if (doc.status === "cancelled") {
        return (
          <div className="StatusIcon cancelled" title="Cancelado">
            <i className="icon-close" />
          </div>
        );
      } else if (doc.status === "late") {
        return (
          <div className="StatusIcon late" title="Atrasado">
            <i className="icon-timer" />
          </div>
        );
      } else if (doc.status === "done") {
        return (
          <div className="StatusIcon done" title="Enviado">
            <i className="icon-done-all" />
          </div>
        );
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
              <div className="field">
                <label>
                  Status
                </label>
                {GenStatusIcon()}
              </div>
              <div className="field userNClient">
                {GenClientBlock()}
                {GenVendorBlock()}
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <STLRenderer ref="renderer" file={this.getModel().get('file')}
              color={doc.color} />
            <a className="button" target="_blank" href={this.getModel().get('file')}>
              Baixar arquivo.
            </a>
          </div>
        </div>
      </div>
    );
  }
})

module.exports = OrderView;