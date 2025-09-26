import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ACCESS_CODE = process.env.ACCESS_CODE
  const { code } = req.body

  if (code !== ACCESS_CODE) {
    return res.status(401).json({ error: 'Invalid code' })
  }

  const cookie = serialize('boswell-auth', 'authorized', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
  })

  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ success: true })
}