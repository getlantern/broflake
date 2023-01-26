// client.go is the main entry point for all client types
package main

import (
	"bufio"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/getlantern/broflake/clientcore"
)

// Two client types are supported: 'desktop' and 'widget'. Informally, widget is a "free" peer and
// desktop is a "censored" peer. Clients share ~90% common internal architecture; the notable
// difference which defines client types is the flavor of workerFSMs and tableRouters selected to
// manage their worker tables. The notion of client type is decoupled from build target -- that is,
// both widget and desktop can be compiled to native binary AND wasm.

var (
	clientType = "desktop"
)

const (
	cTableSize  = 5
	pTableSize  = 5
	busBufferSz = 4096
)

var bfconn *clientcore.BroflakeConn
var ui = clientcore.UIImpl{}
var cTable *clientcore.WorkerTable
var cRouter clientcore.TableRouter
var pTable *clientcore.WorkerTable
var pRouter clientcore.TableRouter
var wgReady sync.WaitGroup

func main() {
	if clientType != "desktop" && clientType != "widget" {
		log.Fatal("Invalid clientType '%v'\n", clientType)
	}

	netstated := os.Getenv("NETSTATED")
	tag := os.Getenv("TAG")
	proxyport := os.Getenv("PORT")
	if proxyport == "" {
		proxyport = "1080"
	}

	log.Printf("Welcome to Broflake\n")
	log.Printf("type: %v, netstated: %v, tag: %v, proxyport: %v", clientType, netstated, tag, proxyport)

	webrtcOptions := &clientcore.WebRTCOptions{
		DiscoverySrv:   "https://broflake-freddie-xdy27ofj3a-ue.a.run.app",
		Endpoint:       "/v1/signal",
		GenesisAddr:    "genesis",
		NATFailTimeout: 5 * time.Second,
		ICEFailTimeout: 5 * time.Second,
		STUNBatch: func(size uint32) (batch []string, err error) {
			// Naive batch logic: at batch time, fetch a public list of servers and select N at random
			res, err := http.Get("https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt")
			if err != nil {
				return batch, err
			}

			candidates := []string{}
			scanner := bufio.NewScanner(res.Body)
			for scanner.Scan() {
				candidates = append(candidates, fmt.Sprintf("stun:%v", scanner.Text()))
			}

			if err := scanner.Err(); err != nil {
				return batch, err
			}

			rand.Seed(time.Now().Unix())

			for i := 0; i < int(size) && len(candidates) > 0; i++ {
				idx := rand.Intn(len(candidates))
				batch = append(batch, candidates[idx])
				candidates[idx] = candidates[len(candidates)-1]
				candidates = candidates[:len(candidates)-1]
			}

			return batch, err
		},
		STUNBatchSize: 5,
		Tag:           tag,
	}

	egressOptions := &clientcore.EgressOptions{
		Addr:           "wss://broflake-egress-xdy27ofj3a-ue.a.run.app",
		Endpoint:       "/ws",
		ConnectTimeout: 5 * time.Second,
	}

	// The boot DAG:
	// build cTable/pTable -> build the Broflake struct -> run ui.Init -> set up the bus and bind
	// the upstream/downstream handlers -> build cRouter/pRouter -> start the bus, init the routers,
	// call onStartup and onReady. This dependency graph currently requires us to implement two
	// switches on clientType during the boot process, which can probably be improved upon.

	// Step 1: Build consumer table and producer table
	switch clientType {
	case "desktop":
		// Desktop peers don't share connectivity for the MVP, so the consumer table only gets one
		// workerFSM for the local user stream associated with their HTTP proxy
		var producerUserStream *clientcore.WorkerFSM
		bfconn, producerUserStream = clientcore.NewProducerUserStream(&wgReady)
		cTable = clientcore.NewWorkerTable([]clientcore.WorkerFSM{*producerUserStream})

		// Desktop peers consume connectivity over WebRTC
		var pfsms []clientcore.WorkerFSM
		for i := 0; i < pTableSize; i++ {
			pfsms = append(pfsms, *clientcore.NewConsumerWebRTC(webrtcOptions, &wgReady))
		}
		pTable = clientcore.NewWorkerTable(pfsms)
	case "widget":
		// Widget peers share connectivity over WebRTC
		var cfsms []clientcore.WorkerFSM
		for i := 0; i < cTableSize; i++ {
			cfsms = append(cfsms, *clientcore.NewProducerWebRTC(webrtcOptions, &wgReady))
		}
		cTable = clientcore.NewWorkerTable(cfsms)

		// Widget peers consume connectivity from an egress server over WebSocket
		var pfsms []clientcore.WorkerFSM
		for i := 0; i < pTableSize; i++ {
			pfsms = append(pfsms, *clientcore.NewEgressConsumerWebSocket(egressOptions, &wgReady))
		}
		pTable = clientcore.NewWorkerTable(pfsms)
	}

	// Step 2: Build Broflake
	broflake := clientcore.NewBroflake(cTable, pTable, &ui, &wgReady)

	// Step 3: Init the UI (this constructs and exposes the JavaScript API as required)
	ui.Init(broflake)

	// Step 4: Set up the bus, bind upstream and downstream UI handlers
	var bus = clientcore.NewIpcObserver(
		busBufferSz,
		clientcore.UpstreamUIHandler(ui, netstated, tag),
		clientcore.DownstreamUIHandler(ui, netstated, tag),
	)

	// Step 5: Build consumer router and producer router
	switch clientType {
	case "desktop":
		cRouter = clientcore.NewConsumerRouter(bus.Downstream, cTable)
		pRouter = clientcore.NewProducerSerialRouter(bus.Upstream, pTable, cTable.Size())
	case "widget":
		cRouter = clientcore.NewConsumerRouter(bus.Downstream, cTable)
		pRouter = clientcore.NewProducerPoolRouter(bus.Upstream, pTable)
	}

	// Step 6: Start the bus, init the routers, fire our UI events to announce that we're ready
	bus.Start()
	cRouter.Init()
	pRouter.Init()
	ui.OnReady()
	ui.OnStartup()

	if clientType == "desktop" {
		runLocalProxy(proxyport)
	}

	select {}
}