
var pathLib = require('path')
var fsLib = require('fs')
var nconf = require('nconf')
var marked = require('marked')

module.exports = function (app) {
	var logger = app.get("logger")

	app.locals.errors = {}

	app.locals.assetUrl = function (mediaType) {
		var relPath = pathLib.join.apply(null, arguments)
		// Check file existence for these.
		switch (mediaType) {
			case "css":
			case "js": {
				var absPath = pathLib.join(nconf.get('staticRoot'), relPath)
				if (!fsLib.existsSync(absPath) && !fsLib.existsSync(absPath+'.js')) {
					if (app.get('env') !== 'production') {
						throw "Required asset "+absPath+" not found."
					} else {
						logger.warn("Required asset "+absPath+" not found.")
					}
				}
			}
		}
		// TODO! check if S3_STATIC_URL exists
		// if (nconf.get('env') === 'production')
		// 	return pathLib.join(nconf.get('S3_STATIC_URL'), relPath)
		// else
		return pathLib.join(nconf.get('staticUrl'), relPath)
	}

	app.locals.defaultMetaObject = {
		title: "Fabrica",
		image: "http:///static/images/logoBB.png",
		description: ".",
		path: "http://",
	}

	// getUrl = // in need of a named-url library for Express 4.x
	app.locals._ = require('lodash')

	app.locals.app = { env: nconf.get('env') }

	app.locals.ids = {
		facebook: nconf.get('facebook_app_id'),
		ga: nconf.get('google_analytics_id'),
		intercom: nconf.get('intercom_id'),
	}

	app.locals.urls = { // while we can't proxy express.Router() calls and namefy them...
		settings: '/settings',
		faq: '/faq',
		about: '/sobre',
		twitter: 'http://twitter.com/deltathinkers',
		github: 'http://github.com/DeltaThinkers',
		facebook: 'http://facebook.com/deltathinkres',
		logo: "http://app.deltathinkers.com/static/images/logoBB.png",
		logout: '/api/me/logout',
		feedbackForm: '',
		blog: 'http://blog.deltathinkers.com',
	}
}