//go:build wasm
// +build wasm

// ui_wasm_impl.go implements the UI interface (see ui.go) for wasm build targets
package main

import (
	"syscall/js"
)

func init() {
	js.Global().Get("wasmClient").Set(
		"start",
		js.FuncOf(func(this js.Value, args []js.Value) interface{} { ui.Start(); return nil }),
	)

	js.Global().Get("wasmClient").Set(
		"stop",
		js.FuncOf(func(this js.Value, args []js.Value) interface{} { ui.Stop(); return nil }),
	)

	js.Global().Get("wasmClient").Set(
		"debug",
		js.FuncOf(func(this js.Value, args []js.Value) interface{} { ui.Debug(); return nil }),
	)
}

type UIImpl struct {
	UI
}

func (ui *UIImpl) Start() {
	start()
}

func (ui *UIImpl) Stop() {
	stop()
}

func (ui *UIImpl) Debug() {
	debug()
}

func (ui *UIImpl) OnReady() {
	js.Global().Get("wasmClient").Call("_onReady")
}

func (ui *UIImpl) OnDownstreamChunk(size int, workerIdx int) {
	js.Global().Get("wasmClient").Call("_onDownstreamChunk", size, workerIdx)
}

func (ui *UIImpl) OnDownstreamThroughput(bytesPerSec int) {
	js.Global().Get("wasmClient").Call("_onDownstreamThroughput", bytesPerSec)
}

func (ui *UIImpl) OnConsumerConnectionChange(newState int, workerIdx int, loc string) {
	js.Global().Get("wasmClient").Call("_onConsumerConnectionChange", newState, workerIdx, loc)
}
