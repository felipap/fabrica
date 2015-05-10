
var $ = require('jquery')
var selectize = require('selectize')

module.exports = function (app) {

  var emailRegex = new RegExp("^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)$");
  function isValidEmail(str) {
    return !!str.match(emailRegex);
  }

  var form = $('.LoginRecoverForm');
  var email = form.find("[name=email]");

  email.on('keyup', function (e) {
    if (email.hasClass('is-wrong')) {
      if (isValidEmail(email.val())) {
        email.removeClass('is-wrong');
      }
    }
  })

  form.submit(function (e) {
    e.preventDefault();
    if (!isValidEmail(email.val())) {
      email.addClass('is-wrong');
    }
    this.submit();
    // if (isValidEmail(email.val())) {
    // }
  })
};
