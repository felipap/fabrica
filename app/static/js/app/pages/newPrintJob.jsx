
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')

require('react.backbone')

const SigninUrl = "api/s3/sign";

var PrintJobForm_NoFile = React.createBackboneClass({

	getInitialState: function() {
		return {
			status: "Selecione um arquivo .stl.",
			uploadPercentage: null,
		}
	},

	_updateProgress: function(percentage, status) {
		this.setState({ status: status, uploadPercentage: percentage });
	},

	componentDidUpdate: function(prevProps, prevState) {
		if (this.refs && this.refs.progressBar) {
			var be = this.refs.progressBar.getDOMNode();
			var up = ''+parseInt(this.state.uploadPercentage)+'%';
			$(be).find('.bar').css('width', up);
		}
	},

	_onFileSelected: function(event) {

		var onError = (message) => {
			this.setState({ status: message });
		}

		var getSigninUrl = (file, callback) => {
			var xhr = new XMLHttpRequest;
			var filename = file.name.replace(/zs+/g, "_");
			xhr.open('GET', SigninUrl+'?objectName='+filename, true);
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('text/plain; charset=x-user-defined');
			}
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status === 200) {
					try {
						var result = JSON.parse(xhr.responseText);
					} catch (error) {
						onError('Invalid signing server response JSON: '+xhr.responseText);
						return false;
					}
					return callback(result);
				}
				onError('Could not contact request signing server. Status = '+xhr.status);
			}.bind(this);
			return xhr.send();
		}

		this._updateProgress(0, "Começando envio do arquivo.");
		var file = this.refs.input.getDOMNode().files[0];
		getSigninUrl(file, function (data) {
			console.log(data);
		})
	},

	render: function() {

		return (
			<div className="PrintJobForm noFile">
				<div className="status">
					{this.state.status}
				</div>
				<input type="file" ref="input" accept="application/stl" onChange={this._onFileSelected} />
				{
					(this.state.uploadPercentage !== null)?
					(
						<div className="progressBar" ref="progressBar">
							<div className="bar"></div>
							<div className="value"></div>
						</div>
					)
					:null
				}
			</div>
		);
	}
})

var PrintJobForm = React.createBackboneClass({
	getInitialState: function() {
		return {
			fileSelected: false,
		}
	},

	render: function() {
		var self = this;

		if (!this.state.fileSelected) {
			return <PrintJobForm_NoFile {...this.props} />
		}

		return (
			<div className="PrintJobForm">
			</div>
		);
	}
});

module.exports = function(app) {

	var printJob = new Models.PrintJob;

	React.render(<PrintJobForm model={printJob} />,
		document.getElementById('form-wrapper'))
};
