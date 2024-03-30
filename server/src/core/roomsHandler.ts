import type { ServerWebSocket } from "bun";
import type { Peer, WsData } from "./core";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";

export const getIP = (ws: ServerWebSocket<unknown>) => {
  let ip = ws.remoteAddress;

  // IPv4 and IPv6 use different values to refer to localhost
  if (ip == "::1" || ip == "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }

  return ip;
};

export const joinRoom =
  (rooms: Map<String, Peer[]>) =>
  (ws: ServerWebSocket<unknown>) =>
  (peerId: string) => {
    let wsData = ws.data as WsData;
    let { userAgent, uuid } = wsData;

    if (userAgent && peerId && uuid) {
      let ip = ws.remoteAddress;
      let room = rooms.get(ip);

      let newPeer = {
        socket: ws,
        peerId,
        name: userAgent,
        uuid,
      };
      if (room) {
        if (room.filter((peer) => peer.uuid == uuid).length >= 1) {
          return;
        }
        room.push(newPeer);
      } else {
        rooms.set(ip, [newPeer]);
      }
    } else {
      ws.terminate();
    }
  };

export const notifyPeer =
  (rooms: Map<String, Peer[]>) => (ws: ServerWebSocket<unknown>) => {
    let ip = ws.remoteAddress;
    pipe(
      O.fromNullable(rooms.get(ip)),
      O.map((room) =>
        room.map((peer) => {
          let filteredRoom = room
            .filter((others) => others.peerId != peer.peerId)
            .map((v) => {
              let { socket, ...rest } = v;
              return rest;
            });
          peer.socket.send(JSON.stringify(filteredRoom));
        })
      )
    );
  };
