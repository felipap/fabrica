
var $ = require('jquery')
var _ = require('lodash')
var Backbone = require('backbone')
var React = require('react')
require('react.backbone')

window._ = _;
Backbone.$ = $;

var Flasher = require('../components/flasher.jsx')
var Dialog = require('../components/modal.jsx')
var Models = require('../components/models.js')

var Pages = {
	Home: require('../pages/home.jsx'),
	Login: require('../pages/login.jsx'),
	Signup: require('../pages/signup.jsx'),
	NewPrintJob: require('../pages/newPrintJob.jsx'),
	NewClient: require('../pages/newClient.jsx'),
	ListClients: require('../pages/listClients.jsx'),
};

$(function () {

	if (window.user) {
		// require('../components/bell.jsx');
		// $('#nav-bell').bell();
	}
});

/*
 * Organizes the allocatin and disposal of components on the screen.
 */
var ComponentStack = function () {
	var pages = [];
	var chopCounter = 0;

	function chop () {
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	}

	function unchop () {
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
	}

	return {
		push: function (component, dataPage, opts) {
			var opts = Object.assign({
				onClose: function () {}
			}, opts || {});

			var old = {
				title: document.title,
				pageRoot: document.body.dataset.root,
			}

			var e = document.createElement('div'),
				destroyed = false,
				changedTitle = false;

			if (opts.pageRoot) {
				var root = document.body.dataset.root;
				$('[data-activate-root='+root+']').removeClass('active');
				$('[data-activate-root='+opts.pageRoot+']').addClass('active');
				document.body.dataset.root = opts.pageRoot;
			}

			// Adornate element and page.
			if (!opts.navbar)
				$(e).addClass('pcontainer');
			if (opts.class)
				$(e).addClass(opts.class);
			$(e).addClass('invisble');
			if (dataPage)
				e.dataset.page = dataPage;

			var obj = {
				target: e,
				component: component,
				setTitle: function (str) {
					changedTitle = true;
					document.title = str;
				},
				destroy: function (dismissOnClose) {
					if (destroyed) {
						console.warn("Destroy for page "+dataPage+" being called multiple times.");
						return;
					}
					destroyed = true;
					pages.splice(pages.indexOf(this), 1);
					// $(e).addClass('invisible');
					React.unmountComponentAtNode(e);
					$(e).remove();

					if (changedTitle) {
						document.title = old.Title;
					}

					var root = document.body.dataset.root;
					$('[data-activate-root='+root+']').removeClass('active');
					$('[data-activate-root='+opts.pageRoot+']').addClass('active');
					document.body.dataset.root = old.pageRoot;

					if (opts.chop !== false) {
						unchop();
					}

					opts.onClose && opts.onClose();
				}.bind(this),
			};
			component.props.page = obj;
			pages.push(obj);

			$(e).hide().appendTo('body');

			// Remove scrollbars?
			if (opts.chop !== false) {
				chop();
			}

			React.render(component, e, function () {
				// $(e).removeClass('invisible');
				$(e).show()
			});

			return obj;
		},
		getActive: function () {
			return pages[pages.length-1];
		},
		pop: function () {
			pages.pop().destroy();
		},
		closeAll: function () {
			for (var i=0; i<pages.length; i++) {
				pages[i].destroy();
			}
			pages = [];
		},
	}
};

/*
 * Organizes the allocatin and disposal of pages on the screen.
 */
var PageStack = function () {
	var pages = [];
	var chopCounter = 0;

	class Page {
		constructor(component, opts) {
			var makeContainer = (opts) => {
				var el = document.createElement('div');
				// if (!opts.navbar) {
				// 	el.classList.add('pcontainer');
				// }
				if (opts.class) {
					el.classList.add(opts.class);
				}
				if (opts.pageTag) {
					el.dataset.page = opts.pageTag;
				}
				return el;
			}

			this.onClose = opts.onClose;

			this.el = makeContainer(opts);
			this.component = component;
			this.destroyed = false;
			this.component.props.page = this;
			this.el.style.opacity = '0%';

			// I don't like this
			if (opts.container) {
				opts.container.appendChild(this.el);
			} else {
				document.body.appendChild(this.el);
			}

			// Save page state values to restore later.
			this.old = {};

			if (opts.chop) { // Remove scrollbars?
				this.old.chopped = true;
				chop();
			}

			if (opts.pageRoot) { // Save body[data-root] and replace by new
				// Cacilds!
				var root = document.body.dataset.root;
				this.old.pageRoot = document.body.dataset.root;
				if (root) {
					var olds = document.querySelectorAll('[data-activate-root='+root+']');
					for (var i=0; i<olds.length; ++i) {
						olds[i].classList.remove('active');
					}
				}
				var news = document.querySelectorAll('[data-activate-root='+opts.pageRoot+']');
				for (var i=0; i<news.length; ++i) {
					news[i].classList.add('active');
				}
				document.body.dataset.root = opts.pageRoot;
			}

			React.render(component, this.el, () => {
				$(this.el).show();
			});
		}

		destroy() {
			if (this.destroyed) {
				console.warn("Destroy for page "+this.opts.pageTag+" being called multiple times.");
				return;
			}
			this.destroyed = true;

			pages.splice(pages.indexOf(this), 1);
			// $(e).addClass('invisible');
			React.unmountComponentAtNode(this.el);
			$(this.el).remove();

			this._cleanUp()

			if (this.onClose) {
				this.onClose(this, this.el);
			}
		}

		_cleanUp() {
			if (this.old.chopped) {
				unchop();
			}
			if (this.old.title) {
				document.title = this.old.title;
			}
			if (this.old.pageRoot !== null) {
				var olds = document.querySelectorAll('[data-activate-root='+
					document.body.dataset.root+']');
				for (var i=0; i<olds.length; ++i) {
					olds[i].classList.remove('active');
				}
				if (this.old.pageRoot !== '') {
					var news = document.querySelectorAll('[data-activate-root='+
						this.old.pageRoot+']');
					for (var i=0; i<news.length; ++i) {
						news[i].classList.add('active');
					}
				}
				document.body.dataset.root = this.old.pageRoot;
			}
		}

		set title(str)  {
			this.old.title = document.title;
			document.title = str;
		}

		hide() {
			this.old.display = this.el.css.display;
			this.el.css.display = 'none';
		}

		show() {
			if (this.old.display) {
				this.el.css.display = this.old.display;
			}
		}
	}

	function chop() {
		// Remove body scrollbar.
		if (chopCounter === 0) {
			$('body').addClass('chop');
		}
		++chopCounter;
	}

	function unchop() {
		// Show body scrollbar?
		--chopCounter;
		if (chopCounter === 0) {
			$('body').removeClass('chop');
		}
	}

	return {
		push: function (component, dataPage, opts) {
			var opts = Object.assign({
				onClose: function () {}
			}, opts || {});
			opts.pageTag = dataPage;
			var page = new Page(component, opts);
			// Hide previous pages.
			for (var i=0; i<pages.length; ++i) {
				pages[i].hide();
			}
			pages.push(page);
		},

		getActive: function () {
			if (!pages.length) {
				return null;
			}
			return pages[pages.length-1];
		},

		pop: function () {
			pages.pop().destroy();
			if (pages.length) {
				pages[pages.length-1].show();
			}
		},

		closeAll: function () {
			pages.forEach(function (page) {
				page.destroy();
			});
			pages = [];
		},
	}
};

/**
 * Customized Backbone Router, supporting triggering of components.
 */
var Router = Backbone.Router.extend({
	initialize: function () {
		this._bindComponentTriggers();
		this._bindComponentCalls();
		this._pages = new PageStack();
		this._compnents = new ComponentStack();
	},

	_bindComponentTriggers: function () {
		$('body').on('click', '[data-trigger=component]', function (e) {
			e.preventDefault();
			// Call router method
			var dataset = this.dataset;
			// Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
			$('body').removeClass('sidebarOpen');
			if (dataset.route) {
				var href = $(this).data('href') || $(this).attr('href');
				if (href)
					console.warn('Component href attribute is set to '+href+'.');
				app.navigate(href, { trigger: true, replace: false });
			} else {
				if (typeof app === 'undefined' || !app.components) {
					if (dataset.href)
						window.location.href = dataset.href;
					else
						console.error("Can't trigger component "+dataset.component+" in unexistent app object.");
					return;
				}
				if (dataset.component in app.components) {
					var data = {};
					if (dataset.args) {
						try {
							data = JSON.parse(dataset.args);
						} catch (e) {
							console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
							console.error(e.stack);
							return;
						}
					}
					// Pass parsed data and element that triggered.
					app.components[dataset.component].call(app, data, this);
				} else {
					console.warn('Router doesn\'t contain component '+dataset.component+'.')
				}
			}
		});
	},

	_bindComponentCalls: function () {
		function bindComponentCall (name, fn) {
			this.on(name, function () {
				this.closeComponents();
				fn.apply(this, arguments);
			}, this);
		}

		for (var c in this.components) {
			if (this.components.hasOwnProperty(c)) {
				bindComponentCall.call(this, c, this.components[c]);
			}
		}
	},

	closeComponents: function () {
		this._components.closeAll();
	},

	pushComponent: function () {
		this._components.push.apply(this._components, arguments);
	},

	closePages: function () {
		this._pages.closeAll();
	},

	pushPage: function () {
		this._pages.push.apply(this._pages, arguments);
	},

	components: {},
});

window.Utils = {
	flash: new Flasher(),

	renderMarkdown: function (txt) {
		var marked = require('marked');
		var renderer = new marked.Renderer();
		renderer.codespan = function (html) { // Ignore codespans in md (they're actually 'latex')
			return '`'+html+'`';
		}
		marked.setOptions({
			renderer: renderer,
			gfm: false,
			tables: false,
			breaks: false,
			pedantic: false,
			sanitize: true,
			smartLists: true,
			smartypants: true,
		})
		return marked(txt);
	},

	pretty: {
		log: function (text) {
			var args = [].slice.apply(arguments);
			args.unshift('Log:');
			args.unshift('font-size: 13px;');
			args.unshift('%c %s');
			console.log.apply(console, args)
		},
		error: function (text) {
		},
	},
};


var BoxWrapper = React.createClass({

	changeOptions: "add reset remove change",

	propTypes: {
		rclass: React.PropTypes.any.isRequired,
	},

	componentWillMount: function () {
		if (this.props.model.getTitle()) {
			this.props.page.setTitle(this.props.model.getTitle());
		}
	},

	close: function () {
		this.props.page.destroy();
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		var Factory = React.createFactory(this.props.rclass);
		return (
			<div className='qi-box' data-doc-id={this.props.model.get('id')}>
				<i className='close-btn icon-clear' data-action='close-page' onClick={this.close}></i>
				<Factory parent={this} {...this.props} />
			</div>
		);
	},
});

/**
 * Central client-side functionality.
 * Defines routes and components.
 */
var App = Router.extend({

	pageRoot: window.conf && window.conf.pageRoot || '/',

	initialize: function () {
		Router.prototype.initialize.apply(this);
	},

	routes: {
		'login':
			function() {
				LoginPage(this);
			},
		'signup':
			function() {
				SignupPage(this);
			},
		'novo/pedido':
			function () {
				Pages.NewPrintJob(this);
			},
		'novo/cliente':
			function () {
				Pages.NewClient(this);
			},
		'clientes':
			function () {
				Pages.ListClients(this);
			},
		'':
			function () {
				Pages.Home(this);
			},
	},

	components: {
		viewPost: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;

			if (!postId) {
				console.warn("No postId supplied to viewPost.", data, resource);
				throw "WTF";
			}

			// Check if resource object came with the html
			if (resource && resource.type === 'post' && resource.data.id === postId) {
			// Resource available on page
				var postItem = new Models.Post(resource.data);
				// Remove window.conf.post, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pushComponent(<BoxWrapper rclass={Views.Post} model={postItem} />, 'post', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			} else {
			// No. Fetch it by hand.
				$.getJSON('/api/posts/'+postId)
					.done(function (response) {
						console.log('response, data', response);
						var postItem = new Models.Post(response.data);
						this.pushComponent(<BoxWrapper rclass={Views.Post} model={postItem} />, 'post', {
							onClose: function () {
								app.navigate(app.pageRoot, { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.responseJSON && xhr.responseJSON.error) {
							Utils.flash.alert(xhr.responseJSON.message || 'Erro! <i class="icon-sad"></i>');
						} else {
							Utils.flash.alert('Contato com o servidor perdido. Tente novamente.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		viewProblem: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;
			if (resource && resource.type === 'problem' && resource.data.id === postId) {
				var postItem = new Models.Problem(resource.data);
				// Remove window.conf.problem, so closing and re-opening post forces us to fetch
				// it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				this.pushComponent(<BoxWrapper rclass={Views.Problem} model={postItem} />, 'problem', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			} else {
				$.getJSON('/api/problems/'+postId)
					.done(function (response) {
						console.log('response, 2data', response);
						var postItem = new Models.Problem(response.data);
						this.pushComponent(<BoxWrapper rclass={Views.Problem} model={postItem} />, 'problem', {
							onClose: function () {
								app.navigate(app.pageRoot, { trigger: false });
							}
						});
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							Utils.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							Utils.flash.alert('Ops.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		viewProblemSet: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;

			var onGetItemData = function (data) {
				var model = new Models.ProblemSet(data);
				this.pushComponent(<BoxWrapper rclass={Views.ProblemSet} model={model} />, 'problem-set', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			}.bind(this)

			if (resource && resource.type === 'problem-set' && resource.data.id === postId) {
				// Remove window.conf.problem, so closing and re-opening post forces us
				// to fetch it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				onGetItemData(resource.data);
			} else {
				var psetSlug = data.slug;
				$.getJSON('/api/psets/s/'+psetSlug)
					.done(function (response) {
						onGetItemData(response.data);
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							Utils.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							Utils.flash.alert('Ops.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		viewProblemSetProblem: function (data) {
			var postId = data.id;
			var resource = window.conf.resource;

			var onGetItemData = function (idata) {
				var model = new Models.ProblemSet(idata);
				this.pushComponent(<BoxWrapper rclass={Views.ProblemSet} pindex={data.pindex} model={model} />,
					'problem-set', {
					onClose: function () {
						app.navigate(app.pageRoot, { trigger: false });
					}
				});
			}.bind(this)

			if (resource && resource.type === 'problem-set' && resource.data.id === postId) {
				// Remove window.conf.problem, so closing and re-opening post forces us
				// to fetch it again. Otherwise, the use might lose updates.
				window.conf.resource = undefined;
				onGetItemData(resource.data);
			} else {
				var psetSlug = data.slug;
				$.getJSON('/api/psets/s/'+psetSlug)
					.done(function (response) {
						onGetItemData(response.data);
					}.bind(this))
					.fail(function (xhr) {
						if (xhr.status === 404) {
							Utils.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
						} else {
							Utils.flash.alert('Ops.');
						}
						app.navigate(app.pageRoot, { trigger: false });
					}.bind(this))
			}
		},

		createProblemSet: function (data) {
			this.pushComponent(Forms.ProblemSet.Create({user: window.user}), 'psetForm');
		},

		editProblemSet: function (data) {
			$.getJSON('/api/psets/s/'+data.slug)
				.done(function (response) {
					console.log('response, data', response);
					var psetItem = new Models.ProblemSet(response.data);
					this.pushComponent(Forms.ProblemSet({model: psetItem}), 'problemForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Problema não encontrado.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		createProblem: function (data) {
			this.pushComponent(Forms.Problem.create({user: window.user}), 'problemForm');
		},

		editProblem: function (data) {
			$.getJSON('/api/problems/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var problemItem = new Models.Problem(response.data);
					this.pushComponent(Forms.Problem.edit({model: problemItem}), 'problemForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						},
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Problema não encontrado.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		editPost: function (data) {
			$.getJSON('/api/posts/'+data.id)
				.done(function (response) {
					console.log('response, data', response);
					var postItem = new Models.Post(response.data);
					this.pushComponent(Forms.Post.edit({model: postItem}), 'postForm', {
						onClose: function () {
							app.navigate(app.pageRoot, { trigger: false });
						}.bind(this),
					});
				}.bind(this))
				.fail(function (xhr) {
					Utils.flash.warn("Publicação não encontrada.");
					app.navigate(app.pageRoot, { trigger: true });
				}.bind(this))
		},

		createPost: function () {
			this.pushComponent(Forms.Post.create({user: window.user}), 'postForm', {
				onClose: function () {
				}
			});
		},

		selectInterests: function (data) {
			var self = this;
			new Interests({}, function () {
			});
		},
	},
});

module.exports = {
	initialize: function () {
		window.app = new App;
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};