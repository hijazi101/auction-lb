// /pages/api/user/by-email.ts

import { prisma } from '@/lib/prisma'; // adjust to your path

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { Email: email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ id: user.Id });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
