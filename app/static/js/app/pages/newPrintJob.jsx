
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Modal = require('../components/modal.jsx')
var Models = require('../components/models.js')

var STLRenderer = require('../components/STLRenderer.jsx')

require('react.backbone')

const SigninUrl = "api/s3/sign";

var PrintJobForm_NoFile = React.createBackboneClass({

	getInitialState: function() {
		return {
			status: "Selecione um arquivo .stl.",
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

		var onFinishS3Put = (file, url, publicUrl) => {
			// function request(data, method, url) {
			// 	var xhr = new XMLHttpRequest;
			// 	xhr.open(method, url, true);
			// 	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			// 	xhr.sendData(data)
			// }
			// request(JSON.stringify(), 'PUT', '/api/s3/confirm');

			this._updateProgress(100, "Arquivo enviado.");
			this.props.parent._onFileUploaded(file, publicUrl);
		};

		var uploadToS3 = (file, url, publicUrl) => {
			// Uploading the file to S3 through a "handmade" xhr is not working for
			// large files (> a couple megabytes). So we're making the XHR and passing
			// it to a jquery ajax call, that is somehow preventing the error from
			// appearing. Making our own XHR and passing it to $.ajax is the only way
			// we can monitor the progress of the upload
			// (see http://stackoverflow.com/a/19127053/396050)

			function makeXHR (file, url) {
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
					return;
				}
				xhr.setRequestHeader('Content-Type', file.type);
				xhr.setRequestHeader('x-amz-acl', 'public-read');
				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) {
						var percentLoaded = Math.round((e.loaded/e.total)*100);
						this._updateProgress(percentLoaded, percentLoaded===100?'Done':'Uploading');
					}
				}
				return xhr;
			}

			var xhr = makeXHR(file, url);
			if (!xhr) {
				onError('CORS not supported.');
				return;
			}

			$.ajax({
				xhr: () => xhr,
				url: url,
				type: 'PUT',
				contentType: file.type,
				data: file.file,
				success: () => {
					console.log('Uploaded data successfully.', arguments);
					this._updateProgress(100, 'Upload completed');
					onFinishS3Put(file, url, publicUrl);
				},
				error: (xhr) => {
					console.log('Failed to upload data.', arguments);
					onError('XHR error.');
				}
			})
		};

		var getSigninUrl = (file, callback) => {
			var xhr = new XMLHttpRequest;
			var filename = file.name.replace(/zs+/g, "_");

			xhr.open('GET', SigninUrl+'?name='+filename+'&type='+file.type, true);

			if (xhr.overrideMimeType) {
				xhr.overrideMimeType('text/plain charset=x-user-defined');
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
		};

		var file = this.refs.input.getDOMNode().files[0];
		this._updateProgress(0, "Começando envio do arquivo.");

		getSigninUrl(file, (result) => {
			uploadToS3(file, result.signed_request, result.url);
		});
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
			selectedFile: false,
		}
	},

	_onFileUploaded: function(file, publicUrl) {
		this.setState({ selectedFile: publicUrl });
	},

	render: function() {
		var self = this;

		if (!this.state.selectedFile) {
			return <PrintJobForm_NoFile {...this.props} parent={this} />
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
