import { Box, Icon, Text } from "@chakra-ui/react";
import type { FC } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { FaFileUpload } from "react-icons/fa";

export interface TargetBoxProps {
  onDrop: (item: { files: any[] }) => void;
  children: React.ReactNode;
}

export const DropBox: FC<TargetBoxProps> = (props) => {
  const { onDrop, children } = props;
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (onDrop) {
          console.log(item);
          onDrop(item);
        }
      },
      canDrop(item: any) {
        console.log("canDrop", item.files, item.items);
        return true;
      },
      hover(item: any) {
        console.log("hover", item.files, item.items);
      },
      collect: (monitor: DropTargetMonitor) => {
        const item = monitor.getItem() as any;
        if (item) {
          console.log("collect", item.files, item.items);
        }

        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [props]
  );

  const isActive = canDrop && isOver;
  return (
    <Box
      ref={drop}
      style={{ minHeight: "70%", borderColor: "white", borderWidth: 2 }}
    >
      {isActive ? (
        <>
          <Box display={"flex"} justifyContent={"center"} height={"100%"}>
            <Box my={"auto"}>
              <Text fontSize="3xl">Drop Here</Text>
            </Box>

            <Icon as={FaFileUpload} my={"auto"} boxSize={"25%"} />
          </Box>
        </>
      ) : (
        children
      )}
    </Box>
  );
};
