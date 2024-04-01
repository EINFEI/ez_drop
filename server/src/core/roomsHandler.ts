import type { ServerWebSocket } from "bun";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import type { Peer, WsData } from "./core";

export const getIP = (ws: ServerWebSocket<unknown>) => {
  let ip = ws.remoteAddress;

  // IPv4 and IPv6 use different values to refer to localhost
  return ip == "::1" || ip == "::ffff:127.0.0.1" ? "127.0.0.1" : ip;
};

export const joinRoom =
  (rooms: Map<String, Peer[]>) =>
  (ws: ServerWebSocket<unknown>) =>
  (peerId: string) => {
    const wsData = ws.data as WsData;
    const { displayName, deviceName, uuid } = wsData;

    if (!peerId || !deviceName || !uuid) {
      ws.terminate();
      return;
    }

    const ip = getIP(ws);
    const room = rooms.get(ip);

    const newPeer = {
      socket: ws,
      peerId,
      displayName,
      deviceName,
      uuid,
    };
    pipe(
      O.fromNullable(room),
      O.map((peers) =>
        peers.some((peer) => peer.uuid === uuid) ? peers : [...peers, newPeer]
      ),
      O.match(
        () => rooms.set(ip, [newPeer]),
        (peers) => rooms.set(ip, peers)
      )
    );
  };

export const notifyPeer =
  (roomsMap: Map<string, Peer[]>) => (ws: ServerWebSocket<unknown>) => {
    const peerList = roomsMap.get(getIP(ws));

    pipe(
      O.fromNullable(peerList),
      O.map((peers) =>
        peers.map((peer) => {
          const filteredPeers = peers
            .filter((p) => p.peerId !== peer.peerId)
            .map(({ socket, ...rest }) => rest);
          peer.socket.send(JSON.stringify(filteredPeers));
        })
      )
    );
  };
