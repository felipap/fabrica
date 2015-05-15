
"use strict";

var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')

require('react.backbone')

var PartnerForm = React.createBackboneClass({

  getInitialState: function() {
    return {
      warnings: {
      },
    };
  },

  _checkClientNew: function() {
  },

  _buildWarnings: function(data) {
    // DECIDE: loop data or loop array of fields?
    var state = {};
    for (var type in data) {
      if (data.hasOwnProperty(type)) {
        if (data[type] instanceof Array) {
          state[type] = data[type].join(' / ');
        } else {
          state[type] = data[type];
        }
      }
    }
    this.setState({ warnings: state });
  },

  _send: function(e) {
    e.preventDefault();

    var data = {
      name: this.refs.name.getDOMNode().value,
      email: this.refs.email.getDOMNode().value,
      phone: this.refs.phone.getDOMNode().value,
    };

    this.getModel().save(data, {
      success: (model, response) => {
        Utils.flash.info("Usuário salvo.");
        // window.location.href = model.get('path');
      },
      error: (model, xhr, options) => {
        var data = xhr.responseJSON;
        if (data && data.message) {
          Utils.flash.alert(data.message);
        } else {
          Utils.flash.alert('Milton Friedman.');
        }
        // build warnings
        // this._buildWarnings(data);
      }
    })
  },

  render: function() {
    return (
      <form className="PartnerForm" onSubmit={this._send}>
        <h1>Cadastre um parceiro</h1>
        <p>
          Falaê, cara.
        </p>
        <div className="form-group">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="">
                Nome da Empresa
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <input type="text" ref="name"
                className={"form-control"+(this.state.warnings.name?" invalid":'')}
                placeholder="Walmart" required={true} />
            </div>
            <div className="col-md-6">
            { this.state.warnings.name?(
              <div className="warning">{this.state.warnings.name}</div>
            ):null }
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="">
                Email de vendas
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <input type="email" ref="email"
                className={"form-control"+(this.state.warnings.email?" invalid":'')}
                placeholder="andre@mail.com" required={true} />
            </div>
            <div className="col-md-6">
            { this.state.warnings.email?(
              <div className="warning">{this.state.warnings.email}</div>
            ):null }
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="">
                Endereço
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <input type="text" ref="email"
                className={"form-control"+(this.state.warnings.address?" invalid":'')}
                placeholder="Rua da Passagem, N. 31. Centro, RJ." required={true} />
            </div>
            <div className="col-md-6">
            { this.state.warnings.address?(
              <div className="warning">{this.state.warnings.address}</div>
            ):null }
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="">
                Telefone
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <input type="tel" ref="phone"
                className={"form-control"+(this.state.warnings.phone?" invalid":'')}
                placeholder="(21) 99999 1234" required={true} />
            </div>
            <div className="col-md-6">
            { this.state.warnings.phone?(
              <div className="warning">{this.state.warnings.phone}</div>
            ):null }
            </div>
          </div>
        </div>
        <button className="form-btn">
          Salvar
        </button>
      </form>
    );
  }
});

module.exports = PartnerForm;