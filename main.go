package main

import (
	"log"
	"runtime"

	"github.com/f03lipe/fabrica/app"
	"github.com/f03lipe/fabrica/app/config"
	"github.com/mgutz/ansi"
)

const APP_VER = "0.0.0"

func init() {
	runtime.GOMAXPROCS(runtime.NumCPU())
}

func main() {
	a := app.App{}
	a.Config = config.Get("./app/config/config.json")
	log.Printf(
		ansi.Color("Starting fabrica in ", "green") +
			ansi.Color(a.Config.Env, "red") +
			ansi.Color(" mode", "green"))
	app.Setup(a)
}
