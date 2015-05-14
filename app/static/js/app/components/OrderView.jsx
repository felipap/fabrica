
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
          <div>
            <label>
              Cliente
            </label>
          </div>

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
      );
    };

    var GenVendorBlock = () => {
      var vendor = doc.vendor;
      return (
        <div className="userDisplay">
          <div>
            <label>
              Vendedor
            </label>
          </div>
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
      );
    };

    return (
      <div className="OrderView">
        <div className="row">
          <div className="col-md-7">
            <div className="orderFields">
              <form>
                <div className="form-group">
                  <label>
                    Nome
                  </label>
                  <input type="text" name="name" className="name"
                    disabled={true} defaultValue={doc.name} />
                </div>
                <div className="form-group">
                  <label>
                    Comentário do Pedido
                  </label>
                  <textarea name="comments" className="comments"
                    disabled={true} defaultValue={doc.comments}>
                  </textarea>
                </div>
                <div className="userNVendor">
                  {GenClientBlock()}
                  {GenVendorBlock()}
                </div>
              </form>
            </div>
          </div>
          <div className="col-md-5">
            <STLRenderer ref="renderer" file={this.getModel().get('file')} />
          </div>
        </div>
      </div>
    );
  }
})

module.exports = OrderView;