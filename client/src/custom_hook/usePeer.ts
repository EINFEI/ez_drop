import { Peer } from "peerjs";
import { useEffect, useState } from "react";
import { actionType } from "../models/action";

export const usePeer = () => {
  const [peer, setPeer] = useState<Peer>();

  useEffect(() => {
    const peer = new Peer();
    peer.on("open", function () {
      setPeer(peer);
    });

    peer.on("connection", (conn) => {
      let bufferChunks: Uint8Array[] = [];
      let receiveTimes = 0;
      conn.on("open", () => {
        conn.send("hello!");
      });
      conn.on("data", (data) => {
        const fileData = data as receiveData;
        const { file, filetype, filename } = fileData;
        switch (fileData.action) {
          case actionType.part:
            bufferChunks[fileData.index] = file;
            console.log("progress: " + receiveTimes / fileData.total);

            receiveTimes++;
            if (receiveTimes == fileData.total) {
              const newfile = new File(bufferChunks, filename, {
                type: filetype,
              });

              // Clear the bufferChunks array for the next file
              downloadFile(newfile);
              bufferChunks = [];
              receiveTimes = 0;
            }

            break;
        }
      });
    });
  }, []);

  return peer;
};

function downloadFile(file: File) {
  let url = URL.createObjectURL(file);
  let tag = document.createElement("a");
  tag.href = url;
  tag.download = file.name;
  tag.click();
  URL.revokeObjectURL(url);
}
