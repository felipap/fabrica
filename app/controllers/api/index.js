
var validator = require('validator')
var mongoose = require('mongoose')
var express = require('express')
var nconf = require('nconf')
var async = require('async')
var aws = require('aws-sdk')
var uuid = require('uuid')

var required = require('app/controllers/lib/required')
var unspam = require('app/controllers/lib/unspam')
var bunyan = require('app/config/bunyan')
var mail = require('app/actions/mail')

var orderActions = require('app/actions/orders')
var userActions = require('app/actions/users')

var User = mongoose.model('User')
var Order = mongoose.model('Order')

aws.config.update({
  accessKeyId: nconf.get('AWS_ACCESS_KEY_ID'),
  secretAccessKey: nconf.get('AWS_SECRET_ACCESS_KEY')
});

var s3 = new aws.S3();

module.exports = function(app) {
  var api = express.Router();
  logger = app.get('logger').child({ child: 'API' });

  api.use(function(req, res, next) {
    req.logger = logger;
    req.logger.info("<"+(req.user && req.user.name || 'anonymous@'+
      req.connection.remoteAddress)+">: HTTP "+req.method+" "+req.url);
    req.isAPICall = true;
    return next();
  });

  api.use(unspam);

  api.param('orderId', function(req, res, next, orderId) {
    Order.findOne({ _id: orderId }, req.handleErr404((order) => {
      req.order = order;
      next();
    }));
  });

  // A little backdoor for debugging purposes.
  api.get('/logmein/:id', function(req, res) {
    if (nconf.get('env') === 'production') {
      if (!req.user || !req.user.flags.mystique || !req.user.flags.admin) {
        return res.status(404).end();
      }
    }

    var is_admin = nconf.get('env') === 'development' || req.user.flags.admin;
    User.findOne({ _id: req.params.id }, req.handleErr(function(user) {
      if (!user) {
        res.endJSON({ error: true, message: 'User not found' });
        return;
      }

      if (!user.flags.fake && !is_admin) {
        res.endJSON({ error: true, message: 'Não pode.' });
        return;
      }

      logger.info('Logging in as ', user.name, user.email);

      req.login(user, function(err) {
        if (err) {
          return res.endJSON({ error: err });
        }
        logger.info('Success??');
        res.redirect('/');
      });
    }));
  });

  api.use(required.login);

  api.use('/users', require('./users')(app));

  api.use('/session', require('./session')(app));

  api.post('/orders', required.self.seller, unspam.limit(2*1000),
  function(req, res, next) {
    req.parse(Order.ParseRules, (body) => {
      User.findOne({ _id: body.client.id }, req.handleErr((client) => {
        if (!client) {
          req.logger.error('Cliente não encontrado! Esse erro não deveria '+
            'estar acontecendo.');
          next({
            message: 'Cliente não encontrado.',
            status: 404,
            process: false,
          });
          return;
        }

        orderActions.place(req.user, client, body, (err, result) => {
          res.endJSON({ message: "Pedido enviado com sucesso." });
        });
      }));
    });
  });

  api.get('/orders/:orderId', unspam.limit(1000),
    function(req, res, next) {
      res.endJSON(req.order.toJSON());
  });

  api.put('/orders', required.self.dthinker,
  unspam.limit(2*1000), function(req, res, next) {
    function doItem(body, next) {
      console.log('body', body)
      Order.findOne({ _id: body._id }, req.handleErr((order) => {
        if (!order) {
          // We can't use req.endJSON here.
          console.log(body);
          next({ message: 'Pedido não encontrado.' });
          return;
        }
        orderActions.update(req.user, order, body, (err, result) => {
          if (err) {
            throw err;
          }
          next(null, result);
        });
      }));
    }

    if (req.body instanceof Array) {
      // User passed an array of objects to update.
      // Parsing errors in ANY of the items is intolerable, so, first,
      // parse every item, then update them individually.
      req.parseArray(Order.UpdateParseRules, (bodies) => {
        async.map(bodies, doItem, function(err, results) {
          if (err) {
            res.endJSON(err);
            return;
          }

          res.endJSON({});
        });
      });
    } else {
      req.parse(Order.UpdateParseRules, (body) => {
        doItem(body, function(err, result) {
          res.endJSON({});
        });
      });
    }
  });

  api.post('/clients', unspam.limit(2*1000), function(req, res, next) {
    req.parse(User.ClientRegisterParseRules, function(reqbody) {
      console.log(reqbody);
      userActions.registerClient(req.user, reqbody, function(err, client) {
        if (err) {
          next(err);
          return;
        }
        res.endJSON(reqbody);
      });
    });
  });

  api.put('/clients', unspam.limit(2*1000), function(req, res) {

  });

  api.get('/get_client', unspam.limit(1*1000), function(req, res, next) {
    if (!validator.isEmail(req.query.email)) {
      next({ err: 'APIError', msg: 'Esse endereço de email é inválido.' });
      return;
    }

    User.findOne({ email: req.query.email }, req.handleErr404(function(user) {
      res.endJSON({
        name: user.name,
        email: user.email,
        picture: user.picture,
        phone: user.phone,
      });
    }));
  });

  api.get('/orders', unspam.limit(1*1000), function(req, res) {
    Order.find({}, req.handleErr(function(docs) {
      res.endJSON(docs);
    }));
  });

  api.get('/myclients', unspam.limit(1*1000), function(req, res) {
    User.find({ 'flags.seller': false }, req.handleErr(function(clients) {
      res.endJSON(clients);
    }));
  });

  api.get('/s3/sign', unspam.limit(1*1000), function(req, res) {
    req.logger.warn("Faz check aqui, felipe");
    var key = 'jobs/' + uuid.v4();
    var params = {
      Bucket: nconf.get('S3_BUCKET'),
      Key: key,
      Expires: 60,
      ACL: 'public-read',
      ContentType: req.query.type
      // Metadata: {
      //   'uploader': req.user.id,
      // },
    };
    s3.getSignedUrl('putObject', params, function(err, data) {
      if (err) {
        console.log('err!', err);
      } else {
        console.log('data', params, data);
        var return_data = {
          signed_request: data,
          url: 'https://' + nconf.get('S3_BUCKET') + '.s3.amazonaws.com/' + key
        };
        res.endJSON(return_data);
      }
    });
  });


  // Handle 404.
  // Don't 'leak' to other controllers: all /api/ should be "satisfied" here.
  api.use(function(req, res) {
    res.status(404).send({
      error: true,
      message: 'Page not found.',
    });
  });

  return api;
};