import { Box, Button, Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";

import { FileList } from "./components/FileList";
import { usePeer } from "./custom_hook/usePeer";
import { useWs } from "./custom_hook/useWs";
import { DropBox } from "./components/DropBox";

function App() {
  const peer = usePeer();
  const rooms = useWs(peer);
  const [files, setFiles] = useState<File[] | undefined>();

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

    conn.on("open", async () => {
      console.log(conn.dataChannel.ordered);
      const chunkSize = 1024 * 1024;

      for (var i = 0; i < files.length; i++) {
        let file = files[i];
        const chunks = Math.ceil(file.size / chunkSize);

        for (let i = 0; i < chunks; i++) {
          const offset = i * chunkSize;
          const chunk = file.slice(offset, offset + chunkSize, file.type);
          console.log("🚀", i / chunks);
          conn.send({
            action: "PART",
            file: chunk,
            filename: file.name,
            filetype: file.type,
            hasNext: offset + chunkSize > file.size ? false : true,
            total: chunks,
            index: i,
          });
        }
      }
    });
  };

  return (
    <Box
      _dark={{ backdropBlur: "10px", backgroundColor: "" }}
      sx={{ height: "100vh" }}
    >
      <Box mb={8}>
        {rooms?.map((p) => (
          <Button onClick={() => handleSendFile(p.peerId)} key={p.uuid}>
            {/* <Text>{p.displayName}</Text> */}

            <Text>{p.deviceName}</Text>
          </Button>
        ))}
      </Box>
      <DndProvider backend={HTML5Backend}>
        <DropBox onDrop={handleFileDrop}>
          <FileList files={files} setFiles={setFiles} />
        </DropBox>
      </DndProvider>
    </Box>
  );
}

export default App;
