package middlewares

import (
	"net/http"

	"github.com/f03lipe/fabrica/modules/router"

	tmplrender "github.com/unrolled/render"
)

var render *tmplrender.Render

type renderer struct {
	*tmplrender.Render
}

// Overrides github.com/unrolled/render's HTML func to make
// router.HTMLOptions into tmplrender.HTMLOptions
func (rt *renderer) HTML(w http.ResponseWriter, status int, name string, binding interface{}, htmlOpts ...router.HTMLOptions) {
	newopts := make([]tmplrender.HTMLOptions, len(htmlOpts))
	for _, o := range htmlOpts {
		newopts = append(newopts, tmplrender.HTMLOptions(o))
	}
	rt.Render.HTML(w, status, name, binding, newopts...)
}

func Render(w router.ResponseWriter, r *http.Request, c *router.Context) error {
	if render == nil {
		render = tmplrender.New(tmplrender.Options{
			Directory:     "./app/templates",
			Extensions:    []string{".html"},
			IsDevelopment: true,
		})
	}

	w.SetRenderer(&renderer{render})
	return nil
}
