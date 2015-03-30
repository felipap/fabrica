/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')

var Box = React.createClass({
	close: function () {
		this.props.close();
	},
	componentDidMount: function () {
		var self = this;
		$('body').on('keypress', function(e){
			if (e.which === 27){
				self.close();
			}
		});
	},
	render: function () {
		return (
			<div>
				<div className="modal-blackout" onClick={this.close} data-action="close-modal"></div>
				<div className="modal-box">
					<i className='close-btn' onClick={this.close} data-action='close-modal'></i>
					{this.props.children}
				</div>
			</div>
		);
	}
});

var Dialog = module.exports = function (component, className, onRender, onClose) {
	var $el = $('<div class="modal">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function close () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
		onClose && onClose($el[0], c);
	}
	component.props.close = close;
	var c = React.render(<Box close={close}>{component}</Box>, $el[0],
		function () {
			// Defer execution, so variable c is set.
			setTimeout(function () {
				$el.fadeIn();
				onRender && onRender($el[0], c);
				$('body').focus();
			}, 10);
		});
}

var Tour = React.createClass({
	render: function () {
		return (
			<div className=''>
			</div>
		);
	},
});

//

module.exports.TourDialog = function (data, onRender, onClose) {
	Dialog(
		Tour(data),
		"tour-modal",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			onClose && onClose.call(this, elm, component);
			app.pages.unchop();
		}
	);
};