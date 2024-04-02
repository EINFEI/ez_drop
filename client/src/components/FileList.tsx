import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  CloseButton,
  Icon,
  Image,
  Wrap,
  WrapItem,
  Text,
} from "@chakra-ui/react";
import { FC, useEffect, useRef } from "react";
import { FaFileAlt } from "react-icons/fa";

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
    <>
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

      <Box sx={{ m: 8, display: "flex", justifyContent: "end" }}>
        <Button onClick={() => setFiles(undefined)}>Clear</Button>
        <Button mx={2} onClick={() => fileInputRef.current?.click()}>
          Upload File
        </Button>
        <Button onClick={() => folderInputRef.current?.click()}>
          Upload Folder
        </Button>
      </Box>
      {files ? (
        <Wrap spacing={5} sx={{ mt: 20, px: 8 }}>
          {Array.from(files).map((file, index) => {
            //   const reader = new FileReader();
            return (
              <WrapItem
                key={index}
                sx={{
                  width: "20%",

                  justifyContent: "center",
                }}
              >
                <Card key={index}>
                  <CardHeader
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text fontSize="xs" overflow="hidden">
                      {file.name}
                    </Text>

                    <CloseButton
                      onClick={() => {
                        setFiles((f) => f?.filter((_, i) => i !== index));
                      }}
                      size="sm"
                    />
                  </CardHeader>

                  <CardBody sx={{ height: 1 }}>
                    {file.type.includes("image") ? (
                      <Image src={URL.createObjectURL(file)}></Image>
                    ) : (
                      <Icon as={FaFileAlt} boxSize={"50"}></Icon>
                    )}
                  </CardBody>
                </Card>
              </WrapItem>
            );
          })}
        </Wrap>
      ) : (
        <Text fontSize={"4xl"} style={{ margin: "auto" }}>
          Drop Here
        </Text>
      )}
    </>
  );
};
