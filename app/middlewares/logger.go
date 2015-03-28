package middlewares

// import (
// 	"fmt"
// 	"log"
// 	"net/http"
// 	"time"

// 	"github.com/f03lipe/fabrica/app/helpers/router"
// )

// // Logger returns a middleware handler that logs the request as it goes in and the response as it goes out.
// func Logger(c *router.Context) error {
// 	start := time.Now()

// 	log.Printf("Started %s %s for %s", c.R.Method, c.R.RequestURI, c.RemoteAddr())

// 	c.Defer(func() {
// 		content := fmt.Sprintf("Completed %s %v %s in %v", c.R.RequestURI,
// 			c.W.Status(), http.StatusText(c.W.Status()), time.Since(start))
// 		if true {
// 			switch c.W.Status() {
// 			case 200, 201, 202:
// 				content = fmt.Sprintf("\033[1;32m%s\033[0m", content)
// 			case 301, 302:
// 				content = fmt.Sprintf("\033[1;37m%s\033[0m", content)
// 			case 304:
// 				content = fmt.Sprintf("\033[1;33m%s\033[0m", content)
// 			case 401, 403:
// 				content = fmt.Sprintf("\033[4;31m%s\033[0m", content)
// 			case 404:
// 				content = fmt.Sprintf("\033[1;31m%s\033[0m", content)
// 			case 500:
// 				content = fmt.Sprintf("\033[1;36m%s\033[0m", content)
// 			}
// 		}
// 		log.Println(content)
// 	})

// 	return nil
// }
