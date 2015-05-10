
var request = require("request");
var nconf = require("nconf");

var endpoint = "https://www.google.com/recaptcha/api/siteverify";

function checkCaptcha(req, res, next) {
  var secret = nconf.get("RECAPTCHA_SECRET");
  var logger = req.logger.child({ middleware: 'checkCaptcha' });

  function onError() {
    logger.error("CAPTCHA NOT CHECKED! BOTS EVERYWHERE!");
    next();
    return;
  }

  if (!secret) {
    logger.error("No RECAPTCHA_SECRET env variable found.");
    return onError();
  }

  var data = {
    secret: secret,
    response: req.body["g-recaptcha-response"],
    remoteip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
  }

  request.post(endpoint, { form: data }, function (err, response, _body) {
    if (err) {
      logger.error("POST to CAPTCHA failed.", err)
      return onError();
    }
    if (response.statusCode !== 200) {
      logger.error("POST to CAPTCHA returned status="+response.statusCode+".", err);
      return onError();
    }
    try {
      var body = JSON.parse(_body);
    } catch (e) {
      logger.error("Failed to parse HTTP200 response from Google.", _body)
      return onError();
    }
    if (!body.success) {
      req.flash('error', "Bot?");
      return next({ name: 'BotDetected' });
    }
    next();
  });
}

module.exports = checkCaptcha;