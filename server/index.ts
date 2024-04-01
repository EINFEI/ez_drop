import type { ServerWebSocket } from "bun";
import type { Peer, WsData } from "./src/core/core";
import * as roomsHandler from "./src/core/roomsHandler";
import * as O from "fp-ts/Option";
import * as R from "ramda";
import { pipe } from "fp-ts/lib/function";

import { UAParser } from "ua-parser-js";
import { faker } from "@faker-js/faker";

let rooms: Map<string, Peer[]> = new Map();

Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  fetch(req, server) {
    // upgrade the request to a WebSocket

    const data: WsData = {
      deviceName: getDeviceName(req.headers.get("user-agent")),
      displayName: faker.internet.displayName(),
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
    // drain,
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
  let ip = roomsHandler.getIP(ws);
  let room = rooms.get(ip);

  pipe(
    O.fromNullable(room),
    O.map((room) => room.filter((peer) => peer.uuid != uuid)),
    O.map((peers) => {
      console.log(peers);
      return peers;
    }),
    O.map((newRoom) =>
      R.ifElse(
        () => R.isEmpty(newRoom),
        () => rooms.delete(ip),
        () => rooms.set(ws.remoteAddress, newRoom)
      )()
    )
  );
  roomsHandler.notifyPeer(rooms)(ws);
}

function getDeviceName(userAgent: string | null) {
  const uap = new UAParser(userAgent ?? "");
  const os = uap.getOS().name;
  const browser = uap.getBrowser().name;
  return `${browser}-${os}`;
}
