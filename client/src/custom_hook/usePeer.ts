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
      conn.on("data", (data) => {
        // console.log(data);
      });
      conn.on("open", () => {
        conn.send("hello!");
      });
      conn.on("data", (data) => {
        let fileData = data as {
          file: Uint8Array;
          filetype: string;
          filename: string;
          action: string;
          hasNext: boolean;
          total: number;
          index: number;
        };
        let { file, filetype, filename } = fileData;
        switch (fileData.action) {
          case actionType.part:
            bufferChunks[fileData.index] = file;
            console.log("progress: " + receiveTimes / fileData.total);

            receiveTimes++;
            if (receiveTimes == fileData.total) {
              let newfile = new File(bufferChunks, filename, {
                type: filetype,
              });
              downloadFile(newfile);
              // Clear the bufferChunks array for the next file
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
