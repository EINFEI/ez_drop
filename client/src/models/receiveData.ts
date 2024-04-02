interface receiveData {
  file: Uint8Array;
  filetype: string;
  filename: string;
  action: string;
  hasNext: boolean;
  total: number;
  index: number;
}
