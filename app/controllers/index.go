package controllers

import (
	"net/http"

	"github.com/f03lipe/fabrica/modules/router"
)

const (
	IndexRoute = "index"
	LoginRoute = "Login"
)

func index(w router.ResponseWriter, r *http.Request, c *router.Context) error {
	// prevent "/" from handling all requests by defaul
	vars := map[string]interface{}{
		"token": c.Data["Token"].(string),
	}
	w.RenderHTML(http.StatusOK, "index", vars)
	return nil
}

func login(w router.ResponseWriter, r *http.Request, c *router.Context) error {
	// prevent "/" from handling all requests by defaul
	vars := map[string]interface{}{
		"token": c.Data["Token"].(string),
	}
	w.RenderHTML(http.StatusOK, "login", vars)
	return nil
}

func BuildIndexRouter(r *router.Router) {
	r.Path("/").Name(IndexRoute)
	r.Path("/login").Name(LoginRoute)
}

func RouteIndex(r *router.Router) {
	// BuildIndexRouter(r)
	r.HandleFunc("/", index).Methods("GET")
}
