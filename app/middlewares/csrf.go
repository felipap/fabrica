package middlewares

import (
	"net/http"

	"github.com/f03lipe/fabrica/modules/router"
	"github.com/justinas/nosurf"
)

func Csrf(w http.ResponseWriter, r *http.Request, c *router.Context) error {
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		c.Data["Token"] = nosurf.Token(r)
	}
	nosurf.New(http.HandlerFunc(nextHandler)).ServeHTTP(w, r)
	return nil
}
