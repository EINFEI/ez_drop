package main

import "github.com/gorilla/websocket"

type WsData struct {
	DeviceName  string `json:"deviceName"`
	DisplayName string `json:"displayName"`
	UUID        string `json:"uuid"`
}

type Peer struct {
	Conn   *websocket.Conn
	PeerID string
	IP     string

	WsData
}

type PeerInfo struct {
	PeerID      string `json:"peerId"`
	DeviceName  string `json:"deviceName"`
	DisplayName string `json:"displayName"`
	UUID        string `json:"uuid"`
}
