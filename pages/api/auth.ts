// pages/api/auth.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  
  // Compare with server-side environment variable
  if (code === process.env.ACCESS_CODE_HASH) {
    res.setHeader(
      'Set-Cookie',
      `boswell-auth=authorized; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
    );
    return res.status(200).json({ success: true });
  }
  
  return res.status(401).json({ error: 'Invalid code' });
}