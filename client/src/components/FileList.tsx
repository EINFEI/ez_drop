import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CloseButton,
  GridItem,
  Icon,
  Image,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { FC, useEffect, useRef } from "react";
import { FaFileAlt } from "react-icons/fa";
import { formatBytes } from "../utlis/formatBytes";

export interface FileListProp {
  files: File[] | undefined;
  setFiles: React.Dispatch<React.SetStateAction<File[] | undefined>>;
}
export const FileList: FC<FileListProp> = (props) => {
  const { files, setFiles } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderInputRef.current !== null) {
      folderInputRef.current.setAttribute("directory", "");
      folderInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, [folderInputRef]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  return (
    <Box w="100%">
      <Box
        p={{ base: 2, md: 8 }} // Changed m to p for internal spacing
        w="100%" // Ensure full width for proper right alignment
        display="flex"
        justifyContent="end"
      >
        <Button
          size={{ base: "sm", md: "md" }}
          onClick={() => setFiles(undefined)}
        >
          Clear
        </Button>
        <Button
          size={{ base: "sm", md: "md" }}
          mx={2}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload File
        </Button>
        <Button
          size={{ base: "sm", md: "md" }}
          onClick={() => folderInputRef.current?.click()}
        >
          Upload Folder
        </Button>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={folderInputRef}
        onChange={handleFileChange}
        type="file"
        style={{ display: "none" }}
      />
      {files && files.length > 0 ? (
        <SimpleGrid
          columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
          spacing={{ base: 2, md: 5 }}
          p={{ base: 2, md: 8 }} // Changed mt to p
        >
          {Array.from(files).map((file, index) => {
            return (
              <GridItem key={index}>
                <Card>
                  <CardHeader
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Tooltip label={file.name}>
                      <Text
                        isTruncated
                        maxW={{ base: "80px", md: "150px" }}
                        fontSize="xs"
                      >
                        {file.name}
                      </Text>
                    </Tooltip>
                    <CloseButton
                      onClick={() => {
                        setFiles((f) => f?.filter((_, i) => i !== index));
                      }}
                      size="sm"
                    />
                  </CardHeader>
                  <CardBody
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={{ base: "5rem", md: "10rem" }}
                  >
                    {file.type.includes("image") ? (
                      <Image
                        src={URL.createObjectURL(file)}
                        maxH="100%"
                        maxW="100%"
                      ></Image>
                    ) : (
                      <Icon as={FaFileAlt} boxSize="50px" color="gray.500" />
                    )}
                  </CardBody>
                  <CardFooter>
                    <Text fontSize="xs" color="gray.500">
                      {formatBytes(file.size)}
                    </Text>
                  </CardFooter>
                </Card>
              </GridItem>
            );
          })}
        </SimpleGrid>
      ) : (
        <VStack w="100%">
          <Text fontSize={{ base: "lg", md: "2xl" }} color="gray.500">
            Drop your files here
          </Text>
          <Text fontSize={{ base: "sm", md: "md" }} color="gray.400">
            or click "Upload File" to select files
          </Text>
        </VStack>
      )}
    </Box>
  );
};
