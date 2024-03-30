import type { ServerWebSocket } from "bun";

// type Room ;
export interface Peer {
  socket: ServerWebSocket<unknown>;
  peerId: string;
  name: string;
  uuid: string;
}

export interface WsData {
  userAgent: string;
  uuid: string;
}
