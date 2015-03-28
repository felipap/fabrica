package helpers

// import (
// 	htmpl "html/template"
// 	"log"
// 	"os"
// 	"path/filepath"
// 	"strings"
// )

// func Parse(t *template.Template, name string, data interface{}) string {
// 	var doc bytes.Buffer
// 	t.ExecuteTemplate(&doc, name, data)
// 	return doc.String()
// }

// var templates = map[string]*htmpl.Template{}

// var tmplPaths = map[string]string{}

// func LoadTemplates(dir string, preCompile bool) (n int) {
// 	n = 0
// 	// Walk items in dir, looking for .html files.
// 	walker := func(path string, info os.FileInfo, err error) error {
// 		name, isDir := info.Name(), info.IsDir()
// 		if isDir {
// 			return nil
// 		}
// 		if name[0] == '.' {
// 			return nil
// 		}
// 		tname := strings.Join(strings.Split(path, "/")[1:], "/")
// 		tmplPaths[tname] = path
// 		// If template pre-compilation is on, compile and store
// 		if preCompile {
// 			// templates[tname], err =
// 		}
// 		n++
// 		return nil
// 	}
// 	_, err := os.Stat(dir)
// 	if err != nil || os.IsNotExist(err) {
// 		log.Fatalf("Templates dir doesn't exist: %s", dir)
// 	}
// 	log.Printf("Ready to walk %s", dir)
// 	filepath.Walk(dir, walker)
// 	return
// }

// func (application *Application) LoadTemplates() error {
// 	var templates []string

// 	fn := func(path string, f os.FileInfo, err error) error {
// 		if f.IsDir() != true && strings.HasSuffix(f.Name(), ".html") {
// 			templates = append(templates, path)
// 		}
// 		return nil
// 	}

// 	err := filepath.Walk(application.Configuration.TemplatePath, fn)

// 	if err != nil {
// 		return err
// 	}

// 	application.Template = template.Must(template.ParseFiles(templates...))
// 	return nil
// }

// func (application *Application) ConnectToDatabase() {
// 	var err error
// 	application.DBSession, err = mgo.Dial(application.Configuration.Database.Hosts)

// 	if err != nil {
// 		glog.Fatalf("Can't connect to the database: %v", err)
// 		panic(err)
// 	}
// }

// func Setup(tpaths []string) {
// 	for _, path := range tpaths {
// 		num := LoadTemplatesIn(path)
// 		fmt.Printf("Loaded %d templates from %s\n", num)
// 	}
// }
