package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/samber/lo"
)

var rooms = struct {
	sync.RWMutex
	m map[string][]*Peer
}{
	m: make(map[string][]*Peer),
}

type WsMessage struct {
	Action string `json:"action"`
	PeerId string `json:"peerId"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		if lo.Contains(AppConfig.Cors, origin) {
			return true
		}

		log.Printf("Blocked connection attempt from untrusted origin: %s", origin)
		return false
	},
}

func main() {
	http.HandleFunc("/", wsHandler)
	fmt.Println("Listening on port", AppConfig.Port)

	var err error
	if AppConfig.EnableHTTPS {
		fmt.Println("Using HTTPS with cert:", AppConfig.CertFile, "key:", AppConfig.KeyFile)
		err = http.ListenAndServeTLS(fmt.Sprintf(":%s", AppConfig.Port), AppConfig.CertFile, AppConfig.KeyFile, nil)
	} else {
		fmt.Println("Using HTTP (HTTPS disabled)")
		err = http.ListenAndServe(fmt.Sprintf(":%s", AppConfig.Port), nil)
	}

	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade failed:", err)
		http.Error(w, "Upgrade failed :(", http.StatusInternalServerError)
		return
	}

	wsData := WsData{
		DeviceName:  getDeviceName(r.Header.Get("User-Agent")),
		DisplayName: gofakeit.FirstName(),
		UUID:        uuid.New().String(),
	}

	peer := &Peer{
		Conn:   conn,
		WsData: wsData,
		IP:     getIP(r),
	}

	go handleMessage(peer)
}

func handleMessage(p *Peer) {
	defer p.Conn.Close()

	for {
		messageType, message, err := p.Conn.ReadMessage()
		if err != nil {
			log.Printf("Peer disconnected (ReadMessage error: %v)", err)
			closeHandler(p) // Handle disconnection
			break
		}

		if messageType == websocket.TextMessage {
			var msg WsMessage
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshalling message: %v", err)
				continue
			}

			switch msg.Action {
			case "INIT":
				p.PeerID = msg.PeerId // Update the Peer with the ID from the message
				joinRoom(p)
			default:

			}
		}

	}
}

func closeHandler(p *Peer) {
	rooms.Lock()

	ip := p.IP
	room, ok := rooms.m[ip]

	if ok {
		// Filter out the disconnected peer using lo.Filter, equivalent to JS array.filter
		newRoomMembers := lo.Filter(room, func(peer *Peer, _ int) bool {
			return peer.UUID != p.UUID
		})

		if len(newRoomMembers) == 0 {
			delete(rooms.m, ip) // Delete the room if it's empty
			log.Printf("Room %s is now empty and deleted.", ip)
		} else {
			rooms.m[ip] = newRoomMembers // Update the room
			log.Printf("Peer %s left room %s. Peers remaining: %d", p.UUID, ip, len(newRoomMembers))
		}
	}

	// Notify remaining peers about the change
	// Note: We need to use a temporary copy of the room data to safely call notifyPeers outside the lock
	var notifyList []*Peer
	if room, ok := rooms.m[ip]; ok {
		notifyList = append([]*Peer{}, room...) // Deep copy for safe iteration
	}

	rooms.Unlock() // Release the lock before calling notifyPeers

	// Notify remaining peers
	if len(notifyList) > 0 {
		notifyPeers(notifyList)
	}

}

func notifyPeers(peerList []*Peer) {
	if len(peerList) == 0 {
		return
	}

	for _, peer := range peerList {
		filteredPeers := lo.FilterMap(peerList, func(p *Peer, _ int) (PeerInfo, bool) {
			return PeerInfo{
				PeerID:      p.PeerID,
				DeviceName:  p.DeviceName,
				DisplayName: p.DisplayName,
				UUID:        p.UUID,
			}, true
		})

		payload, err := json.Marshal(filteredPeers)
		if err != nil {
			log.Printf("Error marshaling peer list for %s: %v", peer.UUID, err)
			continue
		}

		if err := peer.Conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			log.Printf("Error sending message to peer %s: %v", peer.UUID, err)
			// Consider closing the connection if send fails consistently
			peer.Conn.Close()
			closeHandler(peer)
		}
	}
}

func joinRoom(p *Peer) {
	rooms.Lock()

	if p.PeerID == "" {
		p.Conn.Close() // Terminate if no peerId (simple check for INIT message data)
		return
	}

	ip := p.IP
	room, ok := rooms.m[ip]

	// Check if the peer is already in the room
	isAlreadyInRoom := lo.SomeBy(room, func(peer *Peer) bool {
		return peer.UUID == p.UUID
	})

	if !ok {
		// No room exists for this IP, create a new one
		rooms.m[ip] = []*Peer{p}
	} else if !isAlreadyInRoom {
		// Room exists, but peer is new, append the peer
		rooms.m[ip] = append(rooms.m[ip], p)
	}

	log.Printf("Peer %s joined room %s. Total peers: %d", p.UUID, ip, len(rooms.m[ip]))

	// Notify peers about the change (must happen AFTER the lock is released)
	// Safely copy the room list for notification
	notifyList := append([]*Peer{}, rooms.m[ip]...)
	rooms.Unlock()

	notifyPeers(notifyList)

}
