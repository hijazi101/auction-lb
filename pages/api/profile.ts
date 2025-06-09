// /pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // ✅ FIXED

import { verifyJwt } from '@/lib/jwt'; // Make sure you have a JWT verify helper

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  let userId: number;
  try {
    const payload = verifyJwt(token);
    userId = payload.userId;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { Id: userId },
        select: {
          Id: true,
          Email: true,
          Username: true,
          Bio: true,
          ProfileImage: true,
        },
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json(user);
    } catch (error) {
      console.error('API /profile GET error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'PUT') {
    const { username, bio } = req.body;

    if (typeof username !== 'string' || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { Id: userId },
        data: { Username: username, Bio: bio },
        select: { Username: true, Bio: true },
      });
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('API /profile PUT error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
