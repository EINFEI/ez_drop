import type { ServerWebSocket } from "bun";

// type Room ;
export interface Peer {
  socket: ServerWebSocket<unknown>;
  peerId: string;
  deviceName: string;
  displayName: string;
  uuid: string;
}

export interface WsData {
  deviceName: string;
  displayName: string;
  uuid: string;
}
