import { NowRequest, NowResponse } from "@vercel/node";
import { pipeFileToResponse } from "../../src/unzip";
import { validateUrl } from "../../src/validateUrl";

export default async function UnzipApi(req: NowRequest, res: NowResponse) {
  const { archive, path } = req.query;

  if (typeof archive !== "string") {
    res.status(400).send({ error: "expected `archive` param as string" });
    return;
  }

  if (typeof path !== "string") {
    res.status(400).send({ error: "expected `path` query param as string" });
    return;
  }

  validateUrl(archive);
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  pipeFileToResponse(archive, path, res);
}
