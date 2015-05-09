
"use strict";

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')

var STLRenderer = require('../components/STLRenderer.jsx')

require('react.backbone')

const SigninUrl = "/api/s3/sign";

var FormPart_Renderer = React.createBackboneClass({
	render: function() {
		return (
			<div className="formPart renderer">
				<STLRenderer file={this.getModel().get('file')} />
			</div>
		);
	}
});


var FormPart_Upload = React.createBackboneClass({

	getInitialState: function() {
		return {
			status: "Esperando arquivo.",
			uploadPercentage: null,
		}
	},

	componentDidUpdate: function(prevProps, prevState) {
		if (this.refs && this.refs.progressBar) {
			var be = this.refs.progressBar.getDOMNode();
			var up = ''+parseInt(this.state.uploadPercentage)+'%';
			be.querySelector('.bar').style.width = up;
		}
	},

	_updateProgress: function(percentage, status) {
		console.log('Updating progress', percentage, status);
		this.setState({ status: status, uploadPercentage: percentage });
	},

	_onFileSelected: function(event) {
		var onError = (message) => {
			this.setState({ status: message });
		};

		var onFinishS3Put = (publicUrl) => {
			this._updateProgress(100, "Arquivo enviado.");
			this.getModel().set('file', publicUrl);
			// We're done here!
			this.props.parent.advancePosition();
		};

		var uploadToS3 = (file, url, publicUrl) => {
			function createCORSRequest(method, url) {
				var xhr = new XMLHttpRequest;
				if (xhr.withCredentials != null) {
					xhr.open(method, url, true);
				} else if (typeof XDomainRequest !== 'undefined') {
					xhr = new XDomainRequest;
					xhr.open(method, url);
				} else {
					xhr = null;
				}
				return xhr;
			}

			var xhr = createCORSRequest('PUT', url);
			if (!xhr) {
				onError('CORS not supported.');
				return;
			}

			xhr.onload = () => {
				if (xhr.status === 200) {
					onFinishS3Put(publicUrl);
					return;
				}
				onError('Upload error:' + xhr.status);
			}

			xhr.onerror = function(error) {
				console.log('error', error)
			};
			xhr.setRequestHeader('Content-Type', 'text/plain');
			xhr.setRequestHeader('x-amz-acl', 'public-read');
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) {
					var percentLoaded = Math.round((e.loaded/e.total)*100);
					this._updateProgress(percentLoaded, percentLoaded===100?'Done':'Uploading');
				}
			}

			return xhr.send(file);
		};

		var getSigninUrl = (file, callback) => {
			var xhr = new XMLHttpRequest;
			var filename = file.name.replace(/zs+/g, "_");

			xhr.open('GET', SigninUrl+'?name='+filename+'&type=text/plain', true);

			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('text/plain charset=x-user-defined');
			}

			xhr.onreadystatechange = () => {
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
			}
			return xhr.send();
		};

		var file = this.refs.input.getDOMNode().files[0];
		this._updateProgress(0, "Começando envio do arquivo.");

		getSigninUrl(file, (result) => {
			uploadToS3(file, result.signed_request, result.url);
		});
	},

	render: function() {
		return (
			<div className="formPart upload">
				<div className="status">
					{this.state.status}
				</div>
				<form ref="inputForm">
					<input type="file" ref="input" name="file" accept="" onChange={this._onFileSelected} />
				</form>
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

var FormPart_ChooseClient = React.createBackboneClass({
	getInitialState: function() {
		this.tried = {};
		return {
			warning: null,
		}
	},

	componentDidMount: function() {
		var ef = this.refs.email.getDOMNode();
		$(ef).on('keyup', (e) => {
			var trimmed = this.refs.email.getDOMNode().value.replace(/^\s+|\s+$/, '');
			if (trimmed in this.tried) {
				// We know no user exists with this email, so warn user.
				this.setState({ warning: 'Não existe usuário com esse email.'});
			} else {
				if (this.state.warning) {
					// We don't know if the user exists, so remove warning.
					this.setState({ warning: null });
				}
			}
		});
	},

	_send: function(e) {
		e.preventDefault();

		var email = this.refs.email.getDOMNode().value.replace(/^\s+|\s+$/, '');
		if (email.match(/^\s*$/)) {
			this.setState({ warning: 'Use um endereço de email.' });
			return;
		}

		$.ajax({
			url: '/api/clients/exists?',
			data: { email: email },
			dataType: 'json',
			success: (data) => {
				if (!data.exists) {
					this.setState({ warning: 'Não existe usuário com esse email.' });
					this.tried[email] = true;
					return;
				}
				this.getModel().set('user', data);
				this.props.parent.advancePosition();
			},
			error: (xhr, options) => {
				var data = xhr.responseJSON;
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Milton Friedman.');
				}
			}
		})
	},

	render: function() {
		return (
			<div className={"formPart chooseClient "+(this.props.isLatest?'is-latest':'')}>
				<h1>Selecione um cliente <div className="position">passo #{this.props.step}</div></h1>
				<form onSubmit={this._send}>
					<div className="form-group">
						<div className="row">
							<div className="col-md-4">
								<label htmlFor="">
									Email do comprador
								</label>
							</div>
						</div>
						<div className="row">
							<div className="col-md-4">
								<input type="email" ref="email" required={true}
									className={"form-control"+(this.state.warning?" invalid":'')}
									placeholder="joaozinho@mail.com" />
							</div>
							<div className="col-md-6">
							{ this.state.warning?(
								<div className="warning">{this.state.warning}</div>
							):null }
							</div>
						</div>
						<button className="form-btn">
							Salvar
						</button>
					</div>
				</form>
			</div>
		);
	}
})

var PrintJobForm = React.createBackboneClass({
	getInitialState: function() {
		return {
			formPosition: 0,
		}
	},

	advancePosition: function() {
		this.setState({ formPosition: this.state.formPosition+1 });
	},

	render: function() {
		var self = this;

		console.log("rendered", this.getModel().attributes, this.state.formPosition)

		var FormParts = [FormPart_ChooseClient, FormPart_Upload, FormPart_Renderer];
		var formParts = _.map(FormParts, (P, i) => {
			if (i > this.state.formPosition) {
				return null;
			}
			return <P parent={this} {...this.props}
				step={i} isLatest={i===this.state.formPosition} />
		});

		return (
			<div className="PrintJobForm">
				<h1>Novo Pedido</h1>
				{formParts}
			</div>
		);
	}
});

module.exports = function(app) {
	var printJob = new Models.PrintJob;

	function addScript(src) {
		var el = document.createElement('script');
		el.setAttribute('src', src);
		document.body.appendChild(el);
	}

	addScript('/static/js/vendor/three.min.js');
	addScript('/static/js/vendor/stats.min.js');
	addScript('/static/js/vendor/three.STLLoader.js');
	addScript('/static/js/vendor/three.Detector.js');
	addScript('/static/js/vendor/three.TrackballControls.js');

	setTimeout(function () {
		app.pushPage(<PrintJobForm model={printJob} />, 'new-printjob', {
			onClose: function() {
			},
			container: document.querySelector('#page-container'),
			pageRoot: 'new-printjob',
		});
	}, 400);
};