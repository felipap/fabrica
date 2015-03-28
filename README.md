
## Follow style

https://github.com/golang/go/wiki/CodeReviewComments

use middlewares:
https://github.com/Unknwon/macaron#middlewares

Things to solve:

- CSRF DONE
- template
- compression DONE
- security headers
- cookie
- error handling
- json parsing


simulate these:

app.use(require('compression')());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(require('cookie-parser')());

var session = require('express-session');

app.use(require('csurf')());

app.use(require('connect-flash')());  // Flash messages middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(require('./middlewares/errorHandler')); // Handle 500 (and log)


Display

config
^
helpers
^
middlewares
^
controllers