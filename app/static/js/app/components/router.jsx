var $ = require('jquery')
	// require('jquery-cookie')
var Backbone = require('backbone')
var _ = require('lodash')
var React = require('react')
var NProgress = require('nprogress')

window._ = _;
Backbone.$ = $;

var Models = require('../components/models.js')
var Flasher = require('../components/flasher.jsx')
	// var Tour		= require('../components/tour.js')
var Dialog = require('../components/modal.jsx')
var Pages = require('../components/pages.js')

// View-specific (to be triggered by the routes)
var HomePage = require('../pages/home.jsx')
var LoginPage = require('../pages/login.jsx')
var SignupPage = require('../pages/signup.jsx')

if (window.user) {
	require('../components/bell.jsx')
	$('#nav-bell').bell();
}

$(document).ajaxStart(function() {
	NProgress.start()
});
$(document).ajaxComplete(function() {
	NProgress.done()
});

if (window.messages) {
	var messages = window.messages;
	var wrapper = $("#flash-messages");
	for (var type in messages)
	if (messages.hasOwnProperty(type)) {
		for (var i=0; i<messages[type].length; ++i) {
			var m = messages[type][i];
			wrapper.append($("<li class='"+type+"'>"+m+"<i class='close-btn' onClick='$(this.parentElement).slideUp()'></i></li>"))
		}
	}
}


var Fabrica = Backbone.Router.extend({
	pages: new Pages(),
	pageRoot: window.conf && window.conf.pageRoot,
	flash: new Flasher,

	initialize: function() {
	},

	triggerComponent: function(comp, args) {
		comp.call(this, args);
	},

	routes: {
		'settings':
			function() {},
		'login':
			function() {
				LoginPage(this);
			},
		'signup':
			function() {
				SignupPage(this);
			},
		'':
			function() {
				HomePage(this);
				this.pages.closeAll();
			},
	},

	components: {},

	utils: {
		prettyLog: {
			log: function(text) {
				var args = [].slice.apply(arguments);
				args.unshift('Log:');
				args.unshift('font-size: 13px;');
				args.unshift('%c %s');
				console.log.apply(console, args)
			},
			error: function(text) {},
		},
	}
});

module.exports = {
	initialize: function() {
		window.app = new Fabrica;
		Backbone.history.start({
			pushState: true,
			hashChange: false
		});
	},
};