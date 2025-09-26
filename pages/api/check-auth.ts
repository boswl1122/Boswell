import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parse(req.headers.cookie || '');
  const ok = cookies['boswell-auth'] === 'authorized';
  return res.status(ok ? 200 : 401).json({ authorized: ok });
}