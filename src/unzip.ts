import unzipper, { Entry } from "unzipper";
import axios from "axios";
import { Readable, Transform } from "stream";
import { ServerResponse } from "http";

export async function pipeFileToResponse(
  archiveUrl: string,
  path: string,
  res: ServerResponse
): Promise<void> {
  const response = await axios.get<Readable>(archiveUrl, {
    responseType: "stream",
  });
  let found = false;
  await new Promise((resolve, rej) => {
    response.data
      .pipe(unzipper.Parse())
      .pipe(
        new Transform({
          objectMode: true,
          transform(entry: Entry, _e, cb) {
            const fileName = entry.path;
            // const type = entry.type; // 'Directory' or 'File'
            if (fileName === path) {
              found = true;
              entry.pipe(res).on("finish", cb);
            } else {
              entry.autodrain();
              cb();
            }
          },
        })
      )
      .on("finish", resolve)
      .on("error", rej);
  });

  if (!found) {
    res.writeHead(404);
    res.end();
  }
}
