package common

import (
	"net"
	"time"

	"github.com/quic-go/quic-go"
)

// Must be a valid semver
var Version = "v0.0.2"

var VersionHeader = "X-BF-Version"

var QUICCfg = quic.Config{
	MaxIncomingStreams:    int64(2 << 16),
	MaxIncomingUniStreams: int64(2 << 16),
	MaxIdleTimeout:        16 * time.Second,
	KeepAlivePeriod:       8 * time.Second,
}

type DebugAddr string

func (a DebugAddr) Network() string {
	return string(a)
}

func (a DebugAddr) String() string {
	return string(a)
}

// XXX: AddrLocal and AddrRemote were added for compatibility with http-proxy-lantern, and they
// must be a type from the Golang standard library (TCPAddr, UDPAddr, etc.) rather than a
// user-defined type. There's no reason to keep this state other than that http-proxy-lantern is
// interested in it, and it complains if it doesn't receive a "regular" net.Addr type.
type QUICStreamNetConn struct {
	quic.Stream
	OnClose    func()
	AddrLocal  net.Addr
	AddrRemote net.Addr
}

func (c QUICStreamNetConn) LocalAddr() net.Addr {
	return c.AddrLocal
}

func (c QUICStreamNetConn) RemoteAddr() net.Addr {
	return c.AddrRemote
}

func (c QUICStreamNetConn) Close() error {
	if c.OnClose != nil {
		c.OnClose()
	}
	return c.Stream.Close()
}

func IsPublicAddr(addr net.IP) bool {
	return !addr.IsPrivate() && !addr.IsUnspecified() && !addr.IsLoopback()
}
