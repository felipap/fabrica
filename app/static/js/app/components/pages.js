

$('body').on('click', '[data-trigger=component]', function(e) {
  e.preventDefault();
  // Call router method
  var dataset = this.dataset;
  // Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
  $('body').removeClass('sidebarOpen');
  if (dataset.route) {
    var href = $(this).data('href') || $(this).attr('href');
    if (href)
      console.warn('Component href attribute is set to ' + href + '.');
    app.navigate(href, {
      trigger: true,
      replace: false
    });
  } else {
    if (typeof app === 'undefined' || !app.components) {
      if (dataset.href)
        window.location.href = dataset.href;
      else
        console.error("Can't trigger component " + dataset.component + " in unexistent app object.");
      return;
    }
    if (dataset.component in app.components) {
      var data = {};
      if (dataset.args) {
        try {
          data = JSON.parse(dataset.args);
        } catch (e) {
          console.error('Failed to parse data-args ' + dataset.args + ' as JSON object.');
          console.error(e.stack);
          return;
        }
      }
      // Pass parsed data and element that triggered.
      app.components[dataset.component].call(app, data, this);
    } else {
      console.warn('Router doesn\'t contain component ' + dataset.component + '.')
    }
  }
});

module.exports = function() {
  var pages = [];

  this.push = function(component, dataPage, opts) {
    var opts = _.extend({
      onClose: function() {}
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
      setTitle: function(str) {
        changedTitle = true;
        document.title = str;
      },
      destroy: function(dismissOnClose) {
        if (destroyed) {
          console.warn("Destroy for page " + dataPage + " being called multiple times.");
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
          this.unchop();
        }

        opts.onClose && opts.onClose();
      }.bind(this),
    };
    component.props.page = obj;
    pages.push(obj);

    $(e).hide().appendTo('body');

    // Remove scrollbars?
    if (opts.chop !== false) {
      this.chop();
    }

    React.render(component, e, function() {
      // $(e).removeClass('invisible');
      $(e).show()
    });

    return obj;
  };

  this.getActive = function() {
    return pages[pages.length - 1];
  };

  this.pop = function() {
    pages.pop().destroy();
  };

  var chopCounter = 0;

  this.chop = function() {
    if (chopCounter === 0) {
      $('body').addClass('chop');
    }
    ++chopCounter;
  };
  this.unchop = function() {
    --chopCounter;
    if (chopCounter === 0) {
      $('body').removeClass('chop');
    }
  };

  this.closeAll = function() {
    for (var i = 0; i < pages.length; i++) {
      pages[i].destroy();
    }
    pages = [];
  };
};