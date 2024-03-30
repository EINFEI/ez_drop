import type { ServerWebSocket } from "bun";
import type { Peer, WsData } from "./src/core/core";
import * as roomsHandler from "./src/core/roomsHandler";

let rooms: Map<String, Peer[]> = new Map();

Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  fetch(req, server) {
    // upgrade the request to a WebSocket
    console.log(rooms);

    const data: WsData = {
      userAgent: req.headers.get("user-agent") ?? "",
      uuid: crypto.randomUUID(),
    };

    if (server.upgrade(req, { data })) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    message,
    // open,
    close,
    drain(ws) {},
  },
});

console.log("Listening on port 3000...");

function message(ws: ServerWebSocket<unknown>, message: string) {
  let data: { action: string; peerId: string } = JSON.parse(message);
  switch (data?.action) {
    case "INIT":
      let peerId = data?.peerId;
      roomsHandler.joinRoom(rooms)(ws)(peerId);
      roomsHandler.notifyPeer(rooms)(ws);

      break;
    default:
      break;
  }
}

function close(ws: ServerWebSocket, code: number, message: string) {
  let wsData = ws.data as unknown as WsData;
  let uuid = wsData.uuid;
  let ip = ws.remoteAddress;
  let room = rooms.get(ip);

  if (room) {
    let newRoom = room.filter((peer) => peer.uuid != uuid);
    newRoom.length == 0
      ? rooms.delete(ip)
      : rooms.set(ws.remoteAddress, newRoom);

    roomsHandler.notifyPeer(rooms)(ws);
  }
}

//   let name = ws.data;
