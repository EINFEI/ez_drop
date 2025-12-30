import { Box, Icon, Text, VStack } from "@chakra-ui/react";
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
      borderWidth={2}
      borderStyle="dashed"
      borderColor={isActive ? "blue.400" : "gray.300"}
      borderRadius="md"
      p={{ base: 2, md: 4 }}
      minH={{ base: "15rem", md: "30rem" }}
      display="flex"
      justifyContent="center"
      alignItems="center"
      transition="background-color 0.2s ease-in-out"
      bg={isActive ? "blue.50" : "gray.50"}
      _dark={{
        bg: isActive ? "blue.800" : "gray.700",
        borderColor: isActive ? "blue.500" : "gray.600",
      }}
    >
      {isActive ? (
        <VStack>
          <Icon
            as={FaFileUpload}
            boxSize={{ base: "30px", md: "50px" }}
            color="gray.500"
          />
          <Text fontSize={{ base: "md", md: "xl" }} color="gray.500">
            Drop Here
          </Text>
        </VStack>
      ) : (
        children
      )}
    </Box>
  );
};
