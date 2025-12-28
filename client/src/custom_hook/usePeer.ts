import { Peer } from "peerjs";
import { useEffect, useState } from "react";
import {
  ActionType,
  FilePartialData,
  SentRequestData,
} from "../models/receiveData";

type SendingStatus = {
  fileName: string;
  progress: number;
};

export const usePeer = () => {
  const [peer, setPeer] = useState<Peer>();
  const [receivingStatus, setReceivingStatus] = useState<SendingStatus[]>([]);

  const updateReceivingStatus = (fileName: string, progress: number) => {
    setReceivingStatus((status) => {
      const otherStatuses =
        status?.filter((s) => s.fileName !== fileName) || [];
      return [...otherStatuses, { fileName, progress }];
    });
  };


  useEffect(() => {
    const peer = new Peer();
    peer.on("open", function () {
      setPeer(peer);
    });

    peer.on("connection", (conn) => {
      let isConfirmedDownload = false;
      let fileChunks: Record<string, Uint8Array[]> = {};

      const clearAfterDownload = (filename: string) => {
        setReceivingStatus((status) => {
          const otherStatuses =
            status?.filter((s) => s.fileName !== filename) || [];
          return otherStatuses;
        });

        fileChunks[filename].length = 0;
      };

      conn.on("open", () => {
        conn.send("hello!");
      });
      conn.on("data", (data: any) => {
        if (!data || !data.action) return;

        switch (data.action) {
          case ActionType.sendRequest:
            const receivedRequestData = data as SentRequestData;
            const filenames = receivedRequestData.filenames
              .filter((_, idx) => idx < 3)
              .join(", ");
            console.log(
              "Received request from peer: " + receivedRequestData.peerID
            );
            // Clear the bufferChunks array for the next file
            const isConfirmed = window.confirm(
              `Received files ${filenames}..., total: ${receivedRequestData.filenames.length}, download now?`
            );
            if (isConfirmed) {
              conn.send({
                action: ActionType.confirmReceive,
                peerID: peer.id,
                filenames: receivedRequestData.filenames,
              });
              isConfirmedDownload = true;
              setReceivingStatus((status) => [
                ...status,
                ...receivedRequestData.filenames.map((filename) => ({
                  fileName: filename,
                  progress: 0,
                })),
              ]);
            } else {
              conn.close();
            }
            break;

          case ActionType.part:
            const receivedData = data as FilePartialData;
            const { file, filetype, filename, total, index } = receivedData;

            if (!fileChunks[filename]) {
              fileChunks[filename] = Array(total).fill(null);
            }
            fileChunks[filename][index] = file;

            const receiveTimes = fileChunks[filename].filter(
              (chunk) => chunk !== null
            ).length;

            const progress = receiveTimes / total;
            console.log("progress: " + progress);

            updateReceivingStatus(filename, progress);

            const isComplete = fileChunks[filename].every(
              (chunk) => chunk !== null
            );
            if (isComplete && isConfirmedDownload) {
              const newfile = blobToFile(
                fileChunks[filename] as BlobPart[],
                filename,
                filetype
              );
              downloadFile(newfile);
              clearAfterDownload(filename);
            }
            break;
        }
      });
    });
  }, []);

  return { peer, receivingStatus };
};

function blobToFile(
  fileChunks: BlobPart[],
  filename: string,
  filetype: string
): File {
  return new File(fileChunks, filename, {
    type: filetype,
  });
}

function downloadFile(file: File) {
  let url = URL.createObjectURL(file);
  let tag = document.createElement("a");
  tag.href = url;
  tag.download = file.name;
  tag.click();
  URL.revokeObjectURL(url);
}
