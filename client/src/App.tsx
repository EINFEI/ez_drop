import {
  Box,
  Progress,
  Text,
  Container,
  VStack,
  Heading,
  Divider,
  Card,
  CardBody,
  HStack,
  Icon,
} from "@chakra-ui/react";
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
import { FaFileDownload } from "react-icons/fa";

function App() {
  const { peer, receivingStatus } = usePeer();
  const rooms = useWs(peer);
  const [files, setFiles] = useState<File[] | undefined>();
  const [sendingPeers, setSendingPeers] = useState<string[]>([]);

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
          }
          break;
      }
    });

    conn.on("open", async () => {
      // setSendingStatus(ActionType.sendRequest);
      conn.send({
        action: ActionType.sendRequest,
        filenames: files.map((f) => f.name),
      });
    });
  };

  return (
    <Container maxW="container.lg" py={{ base: 2, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <Heading
          as="h1"
          size={{ base: "lg", md: "xl" }}
          textAlign="center"
          mb={2}
        >
          EZ Drop
        </Heading>
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="bold"
          textAlign="center"
          mb={2}
        >
          Your Name: {rooms?.find((p) => p.peerId === peer?.id)?.displayName}
        </Text>
        {receivingStatus && receivingStatus.length > 0 && (
          <Box w="100%">
            <Heading as="h2" size={{ base: "md", md: "lg" }} mb={2}>
              Receiving Files
            </Heading>
            {receivingStatus?.map((status) => {
              // const sender = rooms?.find((r) => r.peerId === status.from);
              return (
                <Card key={status.fileName} mb={2} variant="outline">
                  <CardBody>
                    <HStack>
                      <Icon
                        as={FaFileDownload}
                        boxSize={{ base: 4, md: 6 }}
                        color="blue.500"
                      />
                      <VStack align="start" spacing={1} w="100%">
                        <Text
                          fontSize={{ base: "sm", md: "md" }}
                          fontWeight="bold"
                        >
                          Receiving {status.fileName} from{" "}
                          {/* {sender?.displayName} */}
                        </Text>
                        <HStack w="100%">
                          <Progress
                            size="sm"
                            value={status.progress * 100}
                            hasStripe
                            colorScheme="blue"
                            w="100%"
                          />
                          <Text fontSize={{ base: "xs", md: "sm" }}>
                            {Math.floor(status.progress * 100)}%
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </Box>
        )}

        <Divider />

        <Box w="100%">
          <TargetButtonGroup
            rooms={rooms}
            peer={peer}
            handleSendFile={handleSendFile}
            sendingPeers={sendingPeers}
            files={files}
          />
        </Box>

        <Divider />

        <DndProvider backend={HTML5Backend}>
          <DropBox onDrop={handleFileDrop}>
            <FileList files={files} setFiles={setFiles} />
          </DropBox>
        </DndProvider>
      </VStack>
    </Container>
  );
}

export default App;
