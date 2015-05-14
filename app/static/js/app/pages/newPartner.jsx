
"use strict";

var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')
var PartnerForm = require('../components/PartnerForm.jsx')

require('react.backbone')

module.exports = function(app) {

	var client = new Models.Client;

	app.pushPage(<PartnerForm model={client} />, 'new-partner', {
		onClose: function() {
		},
		container: document.querySelector('#page-container'),
		pageRoot: 'new-partner',
	});
};
