import JSZip, { JSZipObject } from "jszip";

interface Zip {
  name: string;
  files: JSZipObject[];
}

export async function unzip(file: any): Promise<Zip> {
  const zip = await JSZip.loadAsync(file);
  const entriesNames: JSZipObject[] = [];
  zip.forEach((relativePath, zipEntry) => {
    entriesNames.push(zipEntry);
  });
  return {
    name: file.name,
    files: entriesNames,
  };
}
