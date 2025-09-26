import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const header = req.headers.cookie || "";
  const cookies = parse(header);
  if (cookies["boswell-auth"] === "authorized") {
    return res.status(200).json({ authorized: true });
  }
  return res.status(401).json({ authorized: false });
}

