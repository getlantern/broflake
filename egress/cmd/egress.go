package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/elazarl/goproxy"
	"github.com/getlantern/broflake/egress"
)

func main() {
	ctx := context.Background()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	l, err := net.Listen("tcp", fmt.Sprintf(":%v", port))
	if err != nil {
		panic(err)
	}

	ll, err := egress.NewListener(ctx, l)
	if err != nil {
		panic(err)
	}
	defer ll.Close()

	// Instantiate our local HTTP CONNECT proxy
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = true
	log.Printf("Starting HTTP CONNECT proxy...\n")

	proxy.OnRequest().DoFunc(
		func(r *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
			log.Println("HTTP proxy just saw a request:")
			// TODO: overriding the context is a hack to prevent "context canceled" errors when proxying
			// HTTP (not HTTPS) requests. It's not yet clear why this is necessary -- it may be a quirk
			// of elazarl/goproxy. See: https://github.com/getlantern/broflake/issues/47
			r = r.WithContext(context.Background())
			log.Println(r)
			return r, nil
		},
	)

	proxy.OnResponse().DoFunc(
		func(r *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
			// TODO: log something interesting?
			return r
		},
	)

	err = http.Serve(ll, proxy)
	if err != nil {
		panic(err)
	}
}