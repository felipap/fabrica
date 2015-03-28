package controllers

import (
	"net/http"

	"github.com/f03lipe/fabrica/modules/router"
)

func RouteApi(r *router.Router) {

	r.HandleFunc("/",
		func(w router.ResponseWriter, r *http.Request, c *router.Context) error {
			w.RenderJSON(http.StatusOK, map[string]string{
				"message": "Hello. You've hit our API. How can we serve you?",
			})
			return nil
		})

}
