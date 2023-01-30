package clientcore

import (
	"bufio"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type WebRTCOptions struct {
	DiscoverySrv   string
	Endpoint       string
	GenesisAddr    string
	NATFailTimeout time.Duration
	ICEFailTimeout time.Duration
	STUNBatch      func(size uint32) (batch []string, err error)
	STUNBatchSize  uint32
	Tag            string
}

func NewDefaultWebRTCOptions() *WebRTCOptions {
	return &WebRTCOptions{
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
		Tag:           "Barbara Broflake",
	}
}

type EgressOptions struct {
	Addr           string
	Endpoint       string
	ConnectTimeout time.Duration
}

func NewDefaultEgressOptions() *EgressOptions {
	return &EgressOptions{
		Addr:           "wss://broflake-egress-xdy27ofj3a-ue.a.run.app",
		Endpoint:       "/ws",
		ConnectTimeout: 5 * time.Second,
	}
}

type BroflakeOptions struct {
	ClientType  string
	CTableSize  int
	PTableSize  int
	BusBufferSz int
	Netstated   string
}

func NewDefaultBroflakeOptions() *BroflakeOptions {
	return &BroflakeOptions{
		ClientType:  "desktop",
		CTableSize:  5,
		PTableSize:  5,
		BusBufferSz: 4096,
		Netstated:   "",
	}
}
