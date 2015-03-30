
$ = require('jquery')
_ = require('lodash')
// require('bootstrap-tour')
var Modal = require('./modal.jsx')

var Tipit = new (function () {

	this.makeTip = function (target, data) {

		if (!$(target).length) {
			console.warn("Skipping ttip to "+target+". Target not found.");
			return;
		}

		var html = '<div class="ttip animate" data-id="1" data-target="menu">'+
			'<div class="ttip-cta">'+
				'<span class="ttip-center"></span>'+
				'<span class="ttip-beacon"></span>'+
			'</div>'+
			'<div class="ttip-box">'+
				'<div class="header">'+data.header+'</div>'+
				'<p>'+data.text+'</p>'+
				'<div class="footer">'+
					'<a href="#" class="button blue ttip-done">Ok</a>'+
				'</div>'+
			'</div>'+
		'</div>';

		var x = $(target).offset().left+$(target).outerWidth()/2,
				y = $(target).offset().top+$(target).outerHeight()/2;

		var el = $(html).css({ top: y, left: x }).appendTo('body');
		if (x > $(window).width()/2) {
			$(el).addClass('ttip-right');
		}
		$(el).find('.ttip-done').click(function () {
			console.log('done');
			$(el).fadeOut().remove();
		});

		$(el).one('click', function (e) {
			console.log('click', $(e.target).find('.ttip-box'))
			$(this).find('.ttip-box').addClass('open');
			// if ($(this).find('.ttip-box').hasClass('open')) {
			// 	$(this).find('.ttip-box').animate({'opacity': 0}).removeClass('open');
			// } else {
			// }
		})
	};

	this.init = function (ttips, opts) {
		for (var i=0; i<ttips.length; ++i) {
			this.makeTip(ttips[i].el, ttips[i]);
		}
	}
});

module.exports = function (options) {

	Tipit.init([{
		el: '#-bell',
		header: "<i class='icon-notifications'></i> Notificações",
		text: "",
	})

	Modal.TourDialog({}, null, function onClose (el, component) {
		if (window.location.hash === '#tour') // if still tour. [why check?]
			window.location.hash = '';
	});

};