import { FC } from "react";
import { PeerModel } from "../models/peer";

interface PeerListProps {
  rooms: PeerModel[] | undefined;
}

export const PeerList: FC<PeerListProps> = (props) => {
  const { rooms } = props;

  return (
    <>
      {rooms?.map((p) => (
        <button onClick={() => {}} key={p.uuid}>
          {p.deviceName}
        </button>
      ))}
    </>
  );
};
