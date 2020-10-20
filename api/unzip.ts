import { NowRequest, NowResponse } from '@vercel/node';

export default async function UnzipApi(req: NowRequest, res: NowResponse) {
  res.send("Hello, world!");
}
