
var $ = require('jquery')
var selectize = require('selectize')

module.exports = function (app) {

  var emailRegex = new RegExp("^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)$");
  function isValidEmail(str) {
    return !!str.match(emailRegex);
  }

  var form = $('.LoginForm');
  var email = form.find("[name=email]");
  var captcha = form.find(".captcha");
  var captchaResponse = form.find("[name=g-recaptcha-response]");

  email.on('keyup', function (e) {
    if (email.hasClass('is-wrong')) {
      if (isValidEmail(email.val())) {
        email.removeClass('is-wrong');
      }
    }
  })

  // Remove .is-wrong when user clicks captcha.
  function loopAndCheckCaptcha() {
    // so it has come to this...
    (function loop() {
      if (form.find("[name=g-recaptcha-response]").val()) {
        captcha.removeClass('is-wrong');
      } else {
        setTimeout(loop, 500);
      }
    })();
  }

  form.submit(function (e) {
    e.preventDefault();

    var valid = true;
    if (!isValidEmail(email.val())) {
      email.addClass('is-wrong');
      valid = false;
    }

    if (!form.find("[name=g-recaptcha-response]").val()) {
      captcha.addClass('is-wrong');
      loopAndCheckCaptcha();
      valid = false;
    }

    if (valid) {
      this.submit();
    }
  })
};
