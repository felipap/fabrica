package config

import (
	"encoding/json"
	"flag"
	"log"
	"os"
	"path/filepath"
)

type Config struct {
	DBPath                         string `json:"dppath"`
	Debug                          bool
	WebPort                        int    "web port"
	WebHost                        string "web host"
	StaticUrl, StaticRoot, AppRoot string
	Env                            string
	TemplateDir                    string
	TmplPreCompile                 bool
}

func Get(path string) Config {
	C := Config{}
	flag.StringVar(&path, "configFile", path, "path to json configuration file")
	flag.Parse()

	C.WebHost = "0.0.0.0"
	C.WebPort = 7000
	C.StaticUrl = "/static/"
	C.TemplateDir = "/app/templates/"
	C.TmplPreCompile = false

	root, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		log.Fatal(err)
	}

	C.AppRoot = root
	C.StaticRoot = filepath.Join(root, "assets") + "/"

	switch os.Getenv("NODE_ENV") {
	case "production", "development":
		C.Env = os.Getenv("NODE_ENV")
	default:
		// When in doubt, it's safer to suppose it's production
		C.Env = "production"
	}

	if ecp := os.Getenv("FABRICA_CONFIG_PATH"); ecp != "" {
		path = ecp
	}

	file, err := os.Open(path)
	if err != nil {
		log.Fatalf("File error: %v\n", err)
	}

	decoder := json.NewDecoder(file)
	err = decoder.Decode(&C)
	if err != nil {
		log.Fatalf("Error decoding configuration file %s\n%s\n", path, err)
	}
	return C
}
