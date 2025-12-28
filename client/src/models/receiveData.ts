export interface FilePartialData {
  file: Uint8Array;
  filetype: string;
  filename: string;
  action: ActionType;
  total: number;
  index: number;
}

export type SentRequestData = {
  action: ActionType;
  filenames: string[];
  peerID: string;
}

export type ConfirmReceiveData = {
  action: ActionType;
  peerID: string;
}

export enum ActionType {
  part = "PART",
  sendRequest = "SEND_REQUEST",
  confirmReceive = "CONFIRM_RECEIVE",
}
