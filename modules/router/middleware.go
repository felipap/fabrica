package router

import "net/http"

// The Request type extends the http.Request
// Extends http.Request to add ResponseWriter as member, context and more.
type Middleware interface {
	Pre(ResponseWriter, *http.Request, *Context) error
}

type PosMiddleware interface {
	Middleware
	Pos(ResponseWriter, *http.Request, *Context) error
}

// The MiddlewareFunc type is an adapter to allow the use of
// ordinary functions as Middlewares.  If f is a function with
// the appropriate signature, MiddlewareFunc(f) is a Middleware
// object that calls f in its Pre().
type MiddlewareFunc func(ResponseWriter, *http.Request, *Context) error

func (f MiddlewareFunc) Pre(w ResponseWriter, r *http.Request, c *Context) error {
	return f(w, r, c)
}
