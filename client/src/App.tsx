import { usePeer } from "./custom_hook/usePeer";
import "./App.css";
import { useWs } from "./custom_hook/useWs";
import { useState } from "react";

function App() {
  const peer = usePeer();
  const rooms = useWs(peer);
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
    console.log(e.target.files);
  };

  const handleSendFile = (peerId: string) => {
    if (!files) return;
    const conn = peer?.connect(peerId, {
      reliable: true,
    });
    if (!conn) return;

    conn.on("open", async () => {
      console.log(conn.dataChannel.ordered);
      const chunkSize = 1080 * 1080;

      for (var i = 0; i < files.length; i++) {
        let file = files[i];
        const chunks = Math.ceil(file.size / chunkSize);
        console.log("🚀 ~ conn.on ~ chunk:", file.size);

        for (let i = 0; i < chunks; i++) {
          const offset = i * chunkSize;
          const chunk = file.slice(offset, offset + chunkSize, file.type);
          console.log("🚀i", i);
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
    <>
      <div>
        <input type="file" multiple onChange={handleFileChange}></input>
      </div>
      {files && (
        <section>
          File details:
          {Array.from(files).map((file) => {
            return (
              <>
                <li>Name: {file.name}</li>
                <li>Type: {file.type}</li>
                <li>Size: {file.size} bytes</li>
              </>
            );
          })}
          <ul></ul>
        </section>
      )}
      {rooms?.map((p) => (
        <button onClick={() => handleSendFile(p.peerId)} key={p.uuid}>
          {p.name}
        </button>
      ))}
    </>
  );
}

export default App;
