package app

import (
	"log"
	"net/http"
	"path/filepath"

	"github.com/f03lipe/fabrica/app/config"
	"github.com/f03lipe/fabrica/app/controllers"
	"github.com/f03lipe/fabrica/app/middlewares"
	"github.com/f03lipe/fabrica/modules/router"
	"github.com/unrolled/secure"
)

type App struct {
	Config config.Config
}

var app *App

func handleStatic(r *router.Router) {
	// Serve static files.
	surl, sroot := app.Config.StaticUrl, app.Config.StaticRoot
	r.PathPrefix(surl).Handler(
		http.StripPrefix(surl, http.FileServer(http.Dir(sroot))))
	serveOnRoot := func(filename string) {
		r.HandleFunc(filepath.Clean("/"+filename),
			func(w router.ResponseWriter, r *http.Request, c *router.Context) error {
				http.ServeFile(w, r, filepath.Join(sroot, filename))
				return nil
			})
	}
	serveOnRoot("favicon.ico")
	serveOnRoot("robots.txt")
}

func Setup(_app App) {
	app = &_app

	r := router.NewRouter()

	r.Use(middlewares.NewGzip())
	r.UseFunc(middlewares.Csrf)
	r.UseFunc(middlewares.Render)
	r.UseHandler(secure.New().Handler)
	// r.Use(middlewares.AddUser)

	handleStatic(r)

	controllers.RouteIndex(r)
	controllers.RouteApi(r.PathPrefix("/api").Subrouter())

	http.Handle("/", r)

	if err := http.ListenAndServe(":7000", nil); err != nil {
		log.Fatal("ListenAndServe error:", err)
	}
}
