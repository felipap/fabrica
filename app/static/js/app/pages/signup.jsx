
var $ = require('jquery')
var selectize = require('selectize')

module.exports = function (app) {

  var form = $(".LoginForm");

  var p1 = form.find('[name=password1]')
  var p2 = form.find('[name=password2]')

  form.find('[type=password]')
    .on('focusout', function (e) {
      if (p1.val() && p2.val() && p1.val() !== p2.val()) {
        p2.addClass('is-wrong')
      } else {
        p2.removeClass('is-wrong')
      }
    })
    .on('keyup', function (e) {
      if (p1.val() && p2.val() && p1.val() == p2.val()) {
        p2.removeClass('is-wrong')
        $("is-wrong-stuff").remove()
      }
    })

  form.submit(function (e) {
    e.preventDefault();
    e.stopPropagation()
    $("is-wrong-stuff").remove()
    if (p2.hasClass('is-wrong')) {
      $("#flash-messages").append($("<li class='error' id='is-wrong-stuff'>Ops. As senhas estão diferentes.<i class='close-btn' onClick='$(this.parentElement).slideUp()'></i></li>"))
    } else {
      this.submit();
    }
  });

};
