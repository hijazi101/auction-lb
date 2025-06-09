import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const auctions = await prisma.auction.findMany({
      where: {
        userId: Number(userId),
        isDeleted: false,
      },
      orderBy: {
        dateListed: 'desc',
      },
    });

    res.status(200).json(auctions);
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
