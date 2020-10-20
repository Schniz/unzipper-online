import unzipper, { Entry } from "unzipper";
import axios from "axios";
import { Readable, Transform } from "stream";
import { ServerResponse } from 'http';

export type File = { type: string; fileName: string };

export async function listFilesInZip(url: string): Promise<File[]> {
  const response = await axios.get<Readable>(url, {
    responseType: "stream",
  });

  let files: { type: string; fileName: string }[] = [];

  await new Promise((res, rej) => {
    response.data
      .pipe(unzipper.Parse())
      .pipe(
        new Transform({
          objectMode: true,
          transform(entry: Entry, _e, cb) {
            const fileName = entry.path;
            const type = entry.type; // 'Directory' or 'File'
            files.push({ fileName, type });
            entry.autodrain();
            cb();
          },
        })
      )
      .on("finish", res)
      .on("error", rej);
  });
  return files;
}

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
