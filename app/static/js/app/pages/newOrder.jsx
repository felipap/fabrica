
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
	render: function() {
		var selected = this.getModel().get(this.props.field);
		var circles = _.map(this.props.options, (value, key) => {
			var select = () => {
				this.getModel().set(this.props.field, key);
			};
			return (
				<div className={"circle-wrapper"+(selected === key?' selected':'')} key={key}>
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

var DropdownInput = React.createBackboneClass({
	changeOptions: "change:color",

	render: function() {
		var selected = this.getModel().get(this.props.field);
		var options = _.map(this.props.options, (value, key) => {
			var select = () => {
				this.getModel().set(this.props.field, key);
			};
			return (
				<li role="presentation" className={(selected === key?" selected":"")}>
					<button role="menuitem" tabindex="-1" onClick={select}>{value}</button>
				</li>
			);
		})
		return (
			<div className="DropdownInput">
				<div className="dropdown">
					<button className="btn btn-default dropdown-toggle"
						type="button" id="dropdownMenu1" data-toggle="dropdown" aria-expanded="true">
						{this.props.options[selected] || "Escolha uma opção"}
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

var colorOptions = {blue:'#0bf', red:'#f54747', green:'#3ECC5A'};
var materialOptions = {pla:'PLA', pet: 'PET'};

var FormPart_Visualizer = React.createBackboneClass({
	componentDidMount: function() {
		this.getModel().on('change:color', () => {
			this.refs.renderer.setColor(colorOptions[this.getModel().get('color')]);
		});
	},

	render: function() {
		var advance = () => {
			this.props.parent.advancePosition();
		};

		return (
			<div className="formPart renderer">
				<h1>Visualização <div className="position">passo {this.props.step} de {this.props.totalSteps-1}</div></h1>
				<div className="row">
					<div className="col-md-4">
						<div className="field">
							<h1>Escolha uma cor</h1>
							<p>Temos <strong>3 opções de cores</strong> para a sua peça.</p>
							<ColorSelect ref="colors" model={this.getModel()}
								field='color' options={colorOptions}/>
						</div>
						<div className="field">
							<h1>Escolha um material</h1>
							<p>Temos <strong>2 opções de materiais</strong> para a sua peça.</p>
							<DropdownInput ref="materials" model={this.getModel()}
								field='material' options={materialOptions} />
						</div>
						<div className="field">
							<h1>Escolha o tamanho</h1>
						</div>
						<button className="form-btn" onClick={advance}>
							Continuar
						</button>
					</div>
					<div className="col-md-8" style={{padding:0}}>
						<STLRenderer ref="renderer" stats={true} file={this.getModel().get('file')} />
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
				<h1>Selecione um arquivo <div className="position">passo {this.props.step} de {this.props.totalSteps-1}</div></h1>
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
});

var FormPart_ChooseClient = React.createBackboneClass({
	getInitialState: function() {
		this.tried = {};
		return {
			warning: null,
		}
	},

	componentDidUpdate: function() {
		if (this.refs.email) {
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
		}
	},

	_send: function(e) {
		e.preventDefault();

		var email = this.refs.email.getDOMNode().value.replace(/^\s+|\s+$/, '');
		if (email.match(/^\s*$/)) {
			this.setState({ warning: 'Use um endereço de email.' });
			return;
		}

		$.ajax({
			method: 'GET',
			url: '/api/get_client',
			data: { email: email },
			dataType: 'json',
			success: (data) => {
				this.getModel().set('client', data);
			},
			error: (xhr, options) => {
				var data = xhr.responseJSON;
				if (xhr.statusCode === 404) {
					this.setState({ warning: 'Não existe usuário com esse email.' });
					this.tried[email] = true;
					return;
				}
				if (data && data.error === 'APIError') {
					this.setState({ warning: data.message || 'Erro ao processar esse email.' })
					return;
				}
				if (data && data.message) {
					Utils.flash.alert(data.message);
				} else {
					Utils.flash.alert('Um erro inesperado aconteceu.');
				}
			}
		})
	},

	_unselectClient: function () {
		this.getModel().set('client', null);
	},

	_advance: function () {
		if (this.getModel().get('client')) {
			this.props.parent.advancePosition();
		}
	},

	render: function() {
		var client = this.getModel().get('client');

		if (client) {
			return (
				<div className="formPart chooseClient">
					<h1>Selecione um cliente <div className="position">passo {this.props.step} de {this.props.totalSteps-1}</div></h1>
					<p>
						Cliente escolhido:
					</p>
					<div className="userDisplay">
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
					<div className="row">
						<div className="col-md-3">
							<button className="form-btn" onClick={this._advance}>
								Continuar
							</button>
							<button className="form-other-btn" onClick={this._unselectClient}>
								Escolher outro
							</button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="formPart chooseClient">
				<h1>Selecione um cliente <div className="position">passo {this.props.step} de {this.props.totalSteps-1}</div></h1>
				<p>Registre um pedido de um cliente cadastrado entrando com o seu email. <a href="/novo/cliente">Clique aqui para fazer o seu cadastro.</a></p>
				<form onSubmit={this._send} className="form-horizontal">
					<div className="form-group">
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
					<div className="form-group">
						<div className="col-md-3">
							<button className="form-btn">
								Procurar
							</button>
						</div>
					</div>
				</form>
			</div>
		);
	}
});

var FormPart_Naming_Final = React.createBackboneClass({
	componentDidMount: function() {
	},

	_advance: function (e) {
		e.preventDefault();

		this.getModel().set('name', this.refs.name.getDOMNode().value);
		this.getModel().set('comments', this.refs.comments.getDOMNode().value);
		this.props.parent.advancePosition();
	},

	render: function() {
		return (
			<div className="formPart naming">
			<h1>Para terminar... <div className="position">passo {this.props.step} de {this.props.totalSteps-1}</div></h1>
				<form onSubmit={this._advance} className="form-horizontal">
					<div className="form-group">
						<div className="col-md-6">
							<label>Identifique o modelo</label>
							<input type="text" ref="name" required={true} className="form-control"
								placeholder="Ex: Estrela da morte em miniatura" />
						</div>
					</div>
					<div className="form-group">
						<div className="col-md-6">
							<label>Faça comentários sobre a peça</label>
							<textarea ref="comments" className="form-control"
								placeholder="Ex: É possível tapar o buraco da ventilação? É o único ponto fraco dela..."></textarea>
						</div>
					</div>
					<div className="form-group">
						<div className="col-md-3">
							<button className="form-btn">
								Enviar
							</button>
						</div>
					</div>
				</form>
			</div>
		);
	}
});


var FormParts = [
	FormPart_ChooseClient,
	FormPart_Upload,
	FormPart_Visualizer,
	FormPart_Naming_Final,
];

var OrderForm = React.createBackboneClass({
	getInitialState: function() {
		return {
			formPosition: 2,
		}
	},

	save: function() {
		this.getModel().save(null, {
			success: (model, response) => {
			},
			error: (model, xhr, options) => {
			},
		});
	},

	advancePosition: function() {
		console.log('advancePosition!')
		if (this.state.formPosition === FormParts.length-1) {
			this.save();
			return;
		}
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
			<div className="NewOrderForm">
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
	var printJob = new Models.Order({
		client: {
			name: 'Felipe',
			picture: 'http://localhost:3000/static/images/lavatars/F.png',
			email: 'pires.a.felipe@gmail.com',
			id: 'asdf',
		},
		color: 'red',
		// file: 'https://s3-sa-east-1.amazonaws.com/deltathinkers/jobs/dfd691c6-3622-4dc1-9e8c-59d08d87e69c',
		file: 'https://deltathinkers.s3.amazonaws.com/jobs/f057cd47-1ca0-42be-80d1-7c5c1cee668c',
	});


	onLoadThreeJS(function() {
		app.pushPage(<OrderForm model={printJob} />, 'new-order', {
			onClose: function() {
			},
			container: document.querySelector('#page-container'),
			pageRoot: 'new-order',
		});
	});
};