import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  const expected = process.env.ACCESS_CODE;

  if (typeof expected !== 'string' || !expected.length) {
    return res.status(500).json({ error: 'ACCESS_CODE not configured on server' });
  }

  if (code === expected) {
    const cookie = serialize('boswell-auth', 'authorized', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid code' });
}