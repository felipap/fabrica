// Expands on gorilla packages to provide custom functionality.

package router

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

type AppError struct {
	error
	Err     error
	Message string
	Code    int
}

func (e *AppError) Error() string {
	return "AppError:" + e.Message
}

// A Router extends on mux.Router to support middlewares and more.
type Router struct {
	*mux.Router
	middlewares []Middleware
}

func NewRouter() *Router {
	return &Router{Router: mux.NewRouter()}
}

// Initializes a Router from a gorilla mux Router
func NewFromMux(_r *mux.Router) *Router {
	return &Router{Router: _r}
}

func (router *Router) Use(m Middleware) {
	router.middlewares = append(router.middlewares, m)
}

func (router *Router) UseFunc(m func(ResponseWriter, *http.Request, *Context) error) {
	router.Use(MiddlewareFunc(m))
}

func (router *Router) UseHandler(h func(http.Handler) http.Handler) {
	router.UseFunc(func(w ResponseWriter, r *http.Request, c *Context) error {
		nextHandler := func(w http.ResponseWriter, r *http.Request) {}
		h(http.HandlerFunc(nextHandler)).ServeHTTP(w, r)
		return nil
	})
}

//

type Handler interface {
	ServeHTTP(ResponseWriter, *http.Request, *Context) error
}

type WrappedHandler struct {
	middlewares []Middleware
	fn          func(ResponseWriter, *http.Request, *Context) error
}

func NewWrappedHandler(router *Router,
	fn func(ResponseWriter, *http.Request, *Context) error) *WrappedHandler {
	return &WrappedHandler{router.middlewares, fn}
}

func (hf WrappedHandler) ServeHTTP(_writer http.ResponseWriter, request *http.Request) {
	// Save current middlewares, to be executed later, so
	// that middlewares that were not added up until this
	// point don't get executed with this route.
	writer := NewResponseWriter(_writer)
	context := NewContext(writer, request)

	// Apply middlewares.
	// Stop if any of them throw an error.
	// TODO? handle panic?
	for _, m := range hf.middlewares {
		err := m.Pre(writer, request, context)
		if err != nil {
			log.Fatalf("Middleware failed!!! %v", err)
		}
		writer = context.Writer() // our little secret
	}

	// Execute handler.
	// DECIDE: what happens in 404?
	// TODO?: handle panic?
	if err := hf.fn(writer, request, context); err != nil {
		log.Fatalf("Error! Fuck!")
	}

	// FILO please
	for i := len(hf.middlewares); i > 0; i-- {
		if t, ok := hf.middlewares[i-1].(PosMiddleware); ok {
			err := t.Pos(writer, request, context)
			if err != nil {
				log.Fatalf("POS failed!!! %v", err)
			}
		}
	}

	context.Finish()
}

//

func (r *Router) StrictSlash(value bool) *Router {
	r.Router.StrictSlash(value)
	return r
}

/**
 * Override mux's route factories to use middlewares.
 */

// type GetController interface {
// 	Get(w http.ResponseWriter, r *http.Request, c *Context) error
// }

// type PostController interface {
// 	Post(w http.ResponseWriter, r *http.Request, c *Context) error
// }

// type PutController interface {
// 	Put(w http.ResponseWriter, r *http.Request, c *Context) error
// }

// func (router *Router) HandleController(path string, con interface{}) {
// 	satisfies := false

// 	if get, ok := con.(GetController); ok {
// 		satisfies = true
// 		router.HandleFunc(path, get.Get).Methods("GET")
// 	}
// 	if post, ok := con.(PostController); ok {
// 		satisfies = true
// 		router.HandleFunc(path, post.Post).Methods("POST")
// 	}
// 	if put, ok := con.(PutController); ok {
// 		satisfies = true
// 		router.HandleFunc(path, put.Put).Methods("PUT")
// 	}

// 	if !satisfies {
// 		panic("WHAT THE FUCK!")
// 	}
// }

// Rewriting some mux.Route functions to support new Handler Type

type Route struct {
	*mux.Route
	Router *Router
}

func (r *Route) Subrouter() *Router {
	return &Router{Router: r.Route.Subrouter()}
}

func (r *Route) HandlerFunc(
	fn func(ResponseWriter, *http.Request, *Context) error) *Route {
	r.Handler(NewWrappedHandler(r.Router, fn))
	return r
}

//

func (r *Router) HandleFunc(path string,
	fn func(ResponseWriter, *http.Request, *Context) error) *Route {
	return &Route{r.Router.HandleFunc(path, NewWrappedHandler(r, fn).ServeHTTP), r}
}

func (r *Router) Handle(path string, h Handler) *Route {
	return &Route{r.NewRoute().Path(path).Handler(NewWrappedHandler(r, h.ServeHTTP)), r}
}

func (r *Router) Headers(pairs ...string) *Route {
	return &Route{r.NewRoute().Headers(pairs...), r}
}

func (r *Router) Host(tpl string) *Route {
	return &Route{r.NewRoute().Host(tpl), r}
}

func (r *Router) MatcherFunc(f mux.MatcherFunc) *Route {
	return &Route{r.NewRoute().MatcherFunc(f), r}
}

func (r *Router) Methods(methods ...string) *Route {
	return &Route{r.NewRoute().Methods(methods...), r}
}

func (r *Router) Path(tpl string) *Route {
	return &Route{r.NewRoute().Path(tpl), r}
}

func (r *Router) PathPrefix(tpl string) *Route {
	return &Route{r.NewRoute().PathPrefix(tpl), r}
}

func (r *Router) Queries(pairs ...string) *Route {
	return &Route{r.NewRoute().Queries(pairs...), r}
}

func (r *Router) Schemes(schemes ...string) *Route {
	return &Route{r.NewRoute().Schemes(schemes...), r}
}

func (r *Router) BuildVarsFunc(f mux.BuildVarsFunc) *Route {
	return &Route{r.NewRoute().BuildVarsFunc(f), r}
}

func (r *Router) Get(name string) *Route {
	return &Route{r.Router.Get(name), r}
}

func (r *Router) GetRoute(name string) *Route {
	return &Route{r.Router.Get(name), r}
}
