package controllers

import (
	"fmt"
	"net/http"

	"github.com/f03lipe/fabrica/modules/router"
)

func RouteApi(r *router.Router) {

	r.HandleFunc("/",
		func(w http.ResponseWriter, r *http.Request, c *router.Context) error {
			fmt.Fprintf(w, "Hello. You've hit our API. How can we serve you?")
			return nil
		})

}
