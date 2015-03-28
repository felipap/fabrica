package middlewares

// import (
// 	"log"
// 	"net/http"
// )

// func Error(f http.HandlerFunc) http.HandlerFunc {
// 	return func(rw http.ResponseWriter, r *http.Request) {
// 		if err := f(w, r); err == nil {
// 			return
// 		}

// 		switch err.(type) {
// 		// TODO: check for badRequest, notFound, etc
// 		default:
// 			log.Fataln(err)
// 			http.Error(w, "oops", http.StatusInternalServerError)
// 		}
// 	}
// }
