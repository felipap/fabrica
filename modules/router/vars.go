// code adapted from gorilla's context pkg

package router

import (
	"net/http"
	"sync"
	"time"
)

type RequestVars struct {
	sync.RWMutex
	data    map[interface{}]interface{}
	created int64
}

func NewRequestVars(r *http.Request) *RequestVars {
	return &RequestVars{
		data:    make(map[interface{}]interface{}),
		created: time.Now().Unix(),
	}
}

// data  = make(map[*http.Request]map[interface{}]interface{})
// datat = make(map[*http.Request]int64)

// Set stores a value for a given key in a given request.
func (this *RequestVars) Set(key, val interface{}) {
	this.Lock()
	this.data[key] = val
	this.Unlock()
}

// Get returns a value stored for a given key in a given request.
func (this *RequestVars) Get(key interface{}) interface{} {
	this.RLock()
	value := this.data[key]
	this.RUnlock()
	return value
}

// GetOk returns stored value and presence state like multi-value return of map access.
func (this *RequestVars) GetOk(key interface{}) (interface{}, bool) {
	this.RLock()
	value, ok := this.data[key]
	this.RUnlock()
	return value, ok
}

// GetAll returns all stored values for the request as a map. Nil is returned for invalid requests.
func (this *RequestVars) GetAll() map[interface{}]interface{} {
	this.RLock()
	result := make(map[interface{}]interface{}, len(this.data))
	for k, v := range this.data {
		result[k] = v
	}
	this.RUnlock()
	return result
}

// GetAllOk returns all stored values for the request as a map and a boolean value that indicates if
// the request was registered.
func (this *RequestVars) GetAllOk() (map[interface{}]interface{}, bool) {
	this.RLock()
	result := make(map[interface{}]interface{}, len(this.data))
	for k, v := range this.data {
		result[k] = v
	}
	this.RUnlock()
	return result, true
}

// Delete removes a value stored for a given key in a given request.
func (this *RequestVars) Delete(key interface{}) {
	this.Lock()
	delete(this.data, key)
	this.Unlock()
}

// Clear removes all values stored for a given request.
//
// This is usually called by a handler wrapper to clean up request
// variables at the end of a request lifetime.
func (this *RequestVars) Clear() {
	this.Lock()
	this.data = make(map[interface{}]interface{})
	this.Unlock()
}
