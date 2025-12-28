import { Box, Button, Text } from "@chakra-ui/react";
import { FC } from "react";
import { PeerModel } from "../models/peer";
import Peer from "peerjs";
import { ActionType } from "../models/receiveData";

type PeerListProps = {
  rooms: PeerModel[] | undefined;
  peer: Peer | undefined;
  handleSendFile: (peerId: string) => void;
  sendingPeers: string[];
  progress: number;
  sendingStatus: ActionType;
};

export const TargetButtonGroup: FC<PeerListProps> = ({
  rooms,
  peer,
  handleSendFile,
  sendingPeers,
  progress,
  sendingStatus,
}) => {
  if (!rooms || !peer) return <></>;

  const filteredRooms = rooms.filter((p) => p.peerId !== peer?.id);
  const loadingText =
    sendingStatus === ActionType.sendRequest
      ? `Waiting for confirmation...`
      : `Sending... ${Math.floor(progress * 100)}%`;

  return (
    <Box mb={8}>
      {filteredRooms.map((p) => (
        <Button
          mx={2}
          onClick={() => handleSendFile(p.peerId)}
          key={p.uuid}
          isLoading={sendingPeers.includes(p.peerId)}
          loadingText={loadingText}
        >
          <Text>{`${p.displayName} ${p.deviceName}`}</Text>
        </Button>
      ))}
    </Box>
  );
};
