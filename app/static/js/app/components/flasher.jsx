
var $ = require('jquery')
var React = require('react')

var FlashDiv = React.createClass({
	getInitialState: function () {
		return {message:'', action:''};
	},
	message: function (text, className, wait) {
		var wp = this.refs.message.getDOMNode();
		$(wp).fadeOut(function () {
			function removeAfterWait() {
				if (wait) {
					setTimeout(function () {
						$(this).fadeOut();
					}.bind(this), wait);
				}
			}
			$(this.refs.messageContent.getDOMNode()).html(text);
			$(wp).prop('class', 'message '+className).slideDown('fast', removeAfterWait);
		}.bind(this));
	},
	hide: function () {
		$(this.refs.message.getDOMNode()).fadeOut();
	},
	render: function () {
		return (
			<div ref='message' className='message' style={{ 'display': 'none' }} onClick={this.hide}>
				<span ref='messageContent'></span> <i className='close-btn' onClick={this.hide}></i>
			</div>
		);
	},
});

module.exports = (function (message, className, wait) {
	this.fd = React.render(<FlashDiv />, $('<div class=\'flasher\'>').appendTo('body')[0]);

	this.warn = function (message, wait) {
		this.fd.message(message, 'warn', wait || 8000);
	}
  
	this.info = function (message, wait) {
		this.fd.message(message, 'info', wait || 8000);
	}
  
	this.alert = function (message, wait) {
		this.fd.message(message, 'error', wait || 8000);
	}
});
