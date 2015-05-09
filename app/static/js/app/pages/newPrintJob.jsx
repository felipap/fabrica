
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

var ColorSelect = React.createBackboneClass({
	changeOptions: "change:color",

	render: function() {
		var circles = _.map(this.props.colors, (value, key) => {
			var select = () => {
				this.getModel().set({ color: key });
			};
			var selected = this.getModel().get('color') === key;
			return (
				<div className={"circle-wrapper"+(selected?' selected':'')} key={key}>
					<div className="circle" onClick={select}
						style={{backgroundColor: value}} />
				</div>
			)
		})
		return (
			<div className="ColorSelect">
				{circles}
			</div>
		);
	}
});

var DropdownInput = React.createClass({
	changeOptions: "change:color",

	getInitialState: function() {
		return {
			selected: null,
		}
	},

	getValue: function() {
		return this.state.selected;
	},

	render: function() {
		var options = _.map(this.props.options, (value, key) => {
			var select = () => {
				this.setState({ selected: key });
			};
			var selected = this.state.selected === key;
			return (
				<li role="presentation" className={(selected?" selected":"")}>
					<button role="menuitem" tabindex="-1" onClick={select}>{value}</button>
				</li>
			);
		})
		return (
			<div className="DropdownInput">
				<div className="dropdown">
					<button className="btn btn-default dropdown-toggle"
						type="button" id="dropdownMenu1" data-toggle="dropdown" aria-expanded="true">
						{this.props.options[this.state.selected] || "Escolha uma opção"}
						&nbsp;<span className="caret"></span>
					</button>
					<ul className="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
						{options}
					</ul>
				</div>
			</div>
		);
	}
});

var FormPart_Visualizer = React.createBackboneClass({
	_send: function () {
		this.getModel().set('material', this.refs.materials.getValue());

		console.log('model', this.getModel().attributes)

		this.getModel().save(null, {
			success: (model, response) => {
			},
			error: (model, xhr, options) => {
			},
		})
	},

	render: function() {
		var colorOptions = {blue:'#0bf', red:'#f54747', green:'#3ECC5A'};
		var materialOptions = {pla:'PLA', pet: 'PET'};

		return (
			<div className="formPart renderer">
				<h1>Visualização <div className="position">passo {this.props.step} de {this.props.totalSteps}</div></h1>
				<div className="row">
					<div className="col-md-4">
						<div className="field">
							<h1>Escolha uma cor</h1>
							<p>Temos <strong>3 opções de cores</strong> para a sua peça.</p>
							<ColorSelect ref="colors" model={this.getModel()} colors={colorOptions}/>
						</div>
						<div className="field">
							<h1>Escolha um material</h1>
							<p>Temos <strong>2 opções de materiais</strong> para a sua peça.</p>
							<DropdownInput ref="materials" options={materialOptions} />
						</div>
						<div className="field">
							<h1>Escolha o tamanho</h1>
							<ColorSelect ref="colors" model={this.getModel()} colors={colorOptions}/>
						</div>
						<button className="finalize" onClick={this._send}>
							Enviar Pedido
						</button>
					</div>
					<div className="col-md-8">
						<STLRenderer file={this.getModel().get('file')} />
					</div>
				</div>
			</div>
		);
	}
});


var FormPart_Upload = React.createBackboneClass({
	changeOptions: "change:file",

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
			setupLeaveWarning();
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
					this._updateProgress(percentLoaded, percentLoaded===100?'Pronto!':'Enviando.');
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
				<h1>Selecione um arquivo <div className="position">passo {this.props.step} de {this.props.totalSteps}</div></h1>
				<p>Escolha um arquivo 3D para ser impresso. Ele deve ter a extensão <strong>.stl</strong>.</p>
				<h3 className="status">
					{this.state.status}
				</h3>
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
			<div className="formPart chooseClient">
				<h1>Selecione um cliente <div className="position">passo {this.props.step} de {this.props.totalSteps}</div></h1>
				<p>Registre um pedido de um cliente cadastrado entrando com o seu email. <a href="/novo/cliente">Clique aqui para fazer o seu cadastro.</a></p>
				<form onSubmit={this._send}>
					<div className="form-group">
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
			formPosition: 2,
		}
	},

	advancePosition: function() {
		this.setState({ formPosition: this.state.formPosition+1 });
	},

	componentDidUpdate: function(prevProps, prevState) {
		function scrollTo(el) {
			window.el = el;
			console.log($(el).offset().top)
			$('html, body').animate({
				scrollTop: $(el).offset().top
			}, 1000);
		}
		scrollTo(this.getDOMNode().querySelector('.is-latest'));
	},

	render: function() {
		var self = this;

		console.log("rendered", this.getModel().attributes, this.state.formPosition)

		var FormParts = [FormPart_ChooseClient, FormPart_Upload, FormPart_Visualizer];
		var formParts = _.map(FormParts, (P, i) => {
			var restoreHere = () => {
				alert('não tá funcionando, fio')
				// this.setState({ formPosition: i });
			}

			if (i > this.state.formPosition) {
				return null;
			}
			return (
				<div key={i} className={(i===this.state.formPosition)?'is-latest':'is-late'}>
					<div className="curtain">
						<button onClick={restoreHere}>
							Retomar daqui
						</button>
					</div>
					<P parent={this} {...this.props} step={i} totalSteps={FormParts.length} />
				</div>
			)
		});

		return (
			<div className="PrintJobForm">
				<h1>Novo Pedido</h1>
				{formParts}
			</div>
		);
	}
});

// Wait for the user to upload the file before calling this!
function setupLeaveWarning() {
	if (!window.onbeforeunload) {
	  window.onbeforeunload = function() {
	  	return "Se você sair dessa página, terá que entrar com os dados novamente.";
	  }
	}
}

module.exports = function(app) {
	var printJob = new Models.PrintJob({
		color: 'red',
		file: 'https://s3-sa-east-1.amazonaws.com/deltathinkers/jobs/dfd691c6-3622-4dc1-9e8c-59d08d87e69c',
	});

	function addScript(src, cb) {
		var el = document.createElement('script');
		el.src = src;
		el.onload = function(){
			cb();
		}
		document.head.appendChild(el);
	}

	var queue = [
		'/static/js/vendor/three.min.js',
		'/static/js/vendor/stats.min.js',
		'/static/js/vendor/three.STLLoader.js',
		'/static/js/vendor/three.Detector.js',
		'/static/js/vendor/three.TrackballControls.js'
	];

	var i=0;
	(function loadNext() {
		if (queue.length === i) {
			start()
			return;
		}
		console.log('call', i)
		addScript(queue[i++], loadNext);
	})();

	function start() {
		app.pushPage(<PrintJobForm model={printJob} />, 'new-printjob', {
			onClose: function() {
			},
			container: document.querySelector('#page-container'),
			pageRoot: 'new-printjob',
		});
	}
};