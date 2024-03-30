import { useEffect, useRef, useState } from "react";
import { PeerModel } from "../models/peer";
import Peer from "peerjs";

export const useWs = (peer: Peer | undefined) => {
  const [devices, setDevices] = useState<PeerModel[]>();
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:3000");
    let ws = wsRef.current;

    ws.onclose = () => {
      console.log("close connection");
      setDevices([]);
    };

    //接收 Server 發送的訊息
    ws.onmessage = (event) => {
      let data = JSON.parse(event.data);
      setDevices([...data]);
    };

    return () => {
      if (ws.readyState === 1) {
        // <-- This is important
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!wsRef.current) return;
    if (peer?.id && wsRef.current?.readyState == wsRef.current?.OPEN) {
      let ws = wsRef.current;
      ws.send(
        JSON.stringify({
          peerId: peer.id,
          action: "INIT",
        })
      );
    }
  }, [peer, wsRef.current]);

  return devices;
};
