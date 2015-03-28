// based on github.com/phyber/negroni-gzip
package middlewares

import (
	"compress/gzip"
	"log"
	"net/http"
	"strings"

	"github.com/f03lipe/fabrica/modules/router"
)

// These compression constants are copied from the compress/gzip package.
const (
	encodingGzip = "gzip"

	headerAcceptEncoding  = "Accept-Encoding"
	headerContentEncoding = "Content-Encoding"
	headerContentLength   = "Content-Length"
	headerContentType     = "Content-Type"
	headerVary            = "Vary"
	headerSecWebSocketKey = "Sec-WebSocket-Key"

	BestCompression    = gzip.BestCompression
	BestSpeed          = gzip.BestSpeed
	DefaultCompression = gzip.DefaultCompression
	NoCompression      = gzip.NoCompression
)

// gzipResponseWriter is the ResponseWriter that router.ResponseWriter is
// wrapped in.
type gzipResponseWriter struct {
	w *gzip.Writer
	router.ResponseWriter
}

// Write writes bytes to the gzip.Writer. It will also set the Content-Type
// header using the net/http library content type detection if the Content-Type
// header was not set yet.
func (grw gzipResponseWriter) Write(b []byte) (int, error) {
	if len(grw.Header().Get(headerContentType)) == 0 {
		grw.Header().Set(headerContentType, http.DetectContentType(b))
	}
	return grw.w.Write(b)
}

// handler struct contains the ServeHTTP method and the compressionLevel to be
// used.

type Gzip struct {
	compressionLevel int
	gzipWriter       *gzip.Writer
}

func NewGzip() *Gzip {
	return &Gzip{
		compressionLevel: DefaultCompression,
	}
}

func (m *Gzip) Pos(w http.ResponseWriter, r *http.Request, c *router.Context) error {
	w.Header().Del(headerContentLength)
	m.gzipWriter.Close()
	return nil
}

func (m *Gzip) Pre(w http.ResponseWriter, r *http.Request, c *router.Context) error {
	if !strings.Contains(r.Header.Get(headerAcceptEncoding), encodingGzip) {
		return nil
	}

	// Skip compression if client attempt WebSocket connection
	if len(r.Header.Get(headerSecWebSocketKey)) > 0 {
		return nil
	}

	// Create new gzip Writer. Skip compression if an invalid compression level
	// was set.
	gz, err := gzip.NewWriterLevel(w, m.compressionLevel)
	if err != nil {
		log.Fatal("Failed to create gzip writer.", err)
		return nil
	}
	m.gzipWriter = gz // Will be closed later...

	// Set the appropriate gzip headers.
	headers := w.Header()
	headers.Set(headerContentEncoding, encodingGzip)
	headers.Set(headerVary, headerAcceptEncoding)

	// Wrap the original http.ResponseWriter with router.ResponseWriter and
	// create the gzipResponseWriter.
	grw := gzipResponseWriter{
		gz,
		router.NewResponseWriter(w),
	}

	// Suspicious way to substitute the ResponseWriter.
	// Some would call that cheating. I'd call it surviving #golandia.
	c.CheatAndSetWriter(grw)

	return nil
}
