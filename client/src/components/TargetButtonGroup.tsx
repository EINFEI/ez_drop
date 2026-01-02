import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CircularProgress,
  Heading,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import Peer from "peerjs";
import { FC } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { PeerModel } from "../models/peer";

type PeerListProps = {
  rooms: PeerModel[] | undefined;
  peer: Peer | undefined;
  handleSendFile: (peerId: string) => void;
  sendingPeers: string[];
  files: File[] | undefined;
};

export const TargetButtonGroup: FC<PeerListProps> = ({
  rooms,
  peer,
  handleSendFile,
  sendingPeers,
  files,
}) => {
  if (!rooms || !peer) return null;

  const filteredRooms = rooms.filter((p) => p.peerId !== peer?.id);
  const loadingText = `Waiting...`;
  return (
    <Box w="100%">
      <Heading as="h2" size={{ base: "md", md: "lg" }} mb={2}>
        Available Devices
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={5}>
        {filteredRooms.map((p) => (
          <Card key={p.uuid} variant="outline">
            <CardBody>
              <VStack>
                <Avatar name={p.displayName} />
                <Text fontWeight="bold">{p.displayName}</Text>
                <Text fontSize="sm" color="gray.500">
                  {p.deviceName}
                </Text>
              </VStack>
            </CardBody>
            <CardFooter>
              <Tooltip
                label={!files ? "Please select a file to send" : "Send file"}
              >
                <Box w="100%">
                  <Button
                    w="100%"
                    leftIcon={<FaPaperPlane />}
                    onClick={() => handleSendFile(p.peerId)}
                    isLoading={sendingPeers.includes(p.peerId)}
                    loadingText={loadingText}
                    spinner={
                      <CircularProgress isIndeterminate={true} size="24px" />
                    }
                    isDisabled={!files}
                  >
                    Send
                  </Button>
                </Box>
              </Tooltip>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};
