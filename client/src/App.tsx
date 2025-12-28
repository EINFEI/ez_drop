import { Box, Progress, Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";

import { DropBox } from "./components/DropBox";
import { FileList } from "./components/FileList";
import { usePeer } from "./custom_hook/usePeer";
import { useWs } from "./custom_hook/useWs";
import { ActionType } from "./models/receiveData";
import { TargetButtonGroup } from "./components/TargetButtonGroup";

function App() {
  const { peer, receivingStatus } = usePeer();
  const rooms = useWs(peer);
  const [files, setFiles] = useState<File[] | undefined>();
  const [sendingPeers, setSendingPeers] = useState<string[]>([]);
  const [sendingStatus, setSendingStatus] = useState(ActionType.sendRequest);
  const [progress, setProgress] = useState(0);

  const handleFileDrop = useCallback(
    (item: { files: any[] }) => {
      if (item) {
        const files = item.files;
        setFiles((fs) => (fs?.length ? [...fs, ...files] : files));
      }
    },
    [setFiles]
  );

  const handleSendFile = (peerId: string) => {
    if (!files) return;
    const conn = peer?.connect(peerId, {
      reliable: true,
    });
    if (!conn) return;

    conn.on("data", async (data: any) => {
      if (!data || !data.action) return;
      switch (data.action) {
        case ActionType.confirmReceive:
          setSendingStatus(ActionType.confirmReceive);
          console.log("Peer confirmed receiving request", data);
          setSendingPeers((peers) => [...peers, data.peerID]);

          const chunkSize = 1024 * 1024 * 100; // 1MB chunks to avoid large buffers

          for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            let file = files[fileIndex];
            const chunks = Math.ceil(file.size / chunkSize);

            for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
              const offset = chunkIndex * chunkSize;
              const chunk = file.slice(offset, offset + chunkSize, file.type);
              console.log("🚀", chunkIndex / chunks);
              setProgress(chunkIndex / chunks);
              const fileData = new Uint8Array(await chunk.arrayBuffer());
              conn.send({
                action: ActionType.part,
                file: fileData,
                filename: file.name,
                filetype: file.type,
                total: chunks,
                index: chunkIndex,
              });
              // Small delay to prevent overwhelming the connection
              await new Promise((resolve) => setTimeout(resolve, 10));
            }

            setSendingPeers((peers) => peers.filter((p) => p !== data.peerID));
            setProgress(0);
          }
          break;
      }
    });

    conn.on("open", async () => {
      setSendingStatus(ActionType.sendRequest);
      conn.send({
        action: ActionType.sendRequest,
        filenames: files.map((f) => f.name),
      });
    });
  };

  return (
    <Box _dark={{ backdropBlur: "10px", backgroundColor: "" }} h={"90vh"}>
      <Text mb={4} fontSize="lg" fontWeight="bold">
        Your Name: {rooms?.find((p) => p.peerId === peer?.id)?.displayName}
      </Text>
      <Box mb={4}>
        {receivingStatus?.map((status) => (
          <Box key={status.fileName} mb={2}>
            <Text>{status.fileName}</Text>
            <Progress size="xs" value={status.progress * 100} hasStripe />
          </Box>
        ))}
      </Box>

      <TargetButtonGroup
        rooms={rooms}
        peer={peer}
        handleSendFile={handleSendFile}
        sendingPeers={sendingPeers}
        progress={progress}
        sendingStatus={sendingStatus}
      />

      <DndProvider backend={HTML5Backend}>
        <DropBox onDrop={handleFileDrop}>
          <FileList files={files} setFiles={setFiles} />
        </DropBox>
      </DndProvider>
    </Box>
  );
}

export default App;
