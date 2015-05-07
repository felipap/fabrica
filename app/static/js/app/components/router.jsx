
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

var Views = {
	Home: require('../pages/home.jsx'),
	Login: require('../pages/login.jsx'),
	Signup: require('../pages/signup.jsx'),
}

var Pages = {
	NewPrintJob: require('../pages/newPrintJob.jsx'),
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
			var opts = _.extend({
				onClose: function () {}
			}, opts || {});

			var e = document.createElement('div'),
				oldTitle = document.title,
				destroyed = false,
				changedTitle = false;

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
						document.title = oldTitle;
					}

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

/**
 * Customized Backbone Router, supporting triggering of components.
 */
var Router = Backbone.Router.extend({
	initialize: function () {
		this._bindComponentTriggers();
		this._bindComponentCalls();
		this._pages = new ComponentStack();
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
		this._pages.closeAll();
	},

	pushComponent: function () {
		this._pages.push.apply(this._pages, arguments);
	},

	components: {},
})

/**
 * Renders results in el.
 * - setup(collection model, react class for rendering)
 * - renderData(results)
 * - renderPath(url, query, callback)
 * - renderResultsOr(fallbackPath)
 */
function FeedWall (el) {

	'use strict';

	var isSetup = false,
			coll = null,
			tmpl = null,
			stream = null;

	/*
	 * Setup stream collection and template.
	 * This MUST be called before rending.
	 */
	this.setup = function (_Coll, _tmpl) {
		// TODO improve comment
		// Component routes can be called multiple times within the lifespan of a
		// single page load, so we have to prevent setup() from being called
		// multiple times too. Otherwise, the feed would reset everytime a component
		// call is made.
		if (isSetup) {
			console.log("ignoring another setup() call.")
			return;
		}

		// _Coll must be a Backbone collection, and _tmpl a React class.
		coll = new _Coll([]);
		tmpl = React.createFactory(_tmpl);
		isSetup = true;
		stream = React.render(
			<Stream
				wall={conf.isWall}
				collection={coll}
				template={tmpl} />,
			el);
		stream.setCollection(coll);
		stream.setTemplate(tmpl);
	}

	/*
	 * Update results wall with data in feed object.
	 * (usually data bootstraped into page)
	 */
	this.renderData = function (results) {
		console.log('called renderData')
		// Reset wall with results bootstraped into the page
		if (!isSetup) {
			throw "Call setup() before rendering data.";
		}

		if (!results) {
			throw "WHAT";
		}

		coll.url = results.url || window.conf.postsRoot;
		coll.reset(results.docs);
		coll.initialized = true;
		coll.minDate = 1*new Date(results.minDate);

		if (results.eof) {
			coll.trigger('eof');
		}

		return this;
	};

	/*
	 * Render wall with results from a REST resource, using a certain querystring.
	 */
	this.renderPath = function (url, query, cb) {
		console.log('called renderPath')
		if (!isSetup) {
			throw "Call setup() before rendering data.";
		}

		// (string, fn) → (url, cb)
		if (!cb && typeof query === 'function') {
			cb = query;
			query = undefined;
		}

		if (coll.initialized && !query && (!url || coll.url === url)) {
			// Trying to render wall as it was already rendered (app.navigate was
			// used and the route is calling app.renderWall() again). Blocked!
			// TODO: find a better way of handling this?
			console.log('Wall already rendered. ok.');
			return;
		}

		coll.initialized = true;
		coll.url = url || coll.url || (window.conf && window.conf.postsRoot);
		coll.reset();
		if (cb) {
			coll.once('reset', cb);
		}
		coll.fetch({ reset: true, data: query || {} });

		return this;
	};

	/*
	 * ???
	 */
	this.renderResultsOr = function (fallbackPath) {
		console.log('called renderResultsOr')
		if (!isSetup) {
			throw "Call setup() before rendering data.";
		}

		if (window.conf.results) {
			this.renderData(window.conf.results);
		} else {
			this.renderPath(fallbackPath);
		}

		return this;
	}.bind(this);
};


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

		if (document.getElementById('qi-results')) {
			this.FeedWall = new FeedWall(document.getElementById('qi-results'));
		} else {
			this.FeedWall = null;
			console.log("No stream container found.");
		}
	},

	routes: {
		'novo':
			function () {
				Pages.NewPrintJob(this);
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