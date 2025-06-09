import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.split(' ')[1];
  let subscriberId: number;
  try {
    const payload = verify(token, process.env.JWT_SECRET!) as any;
    subscriberId = payload.userId;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // 1) get list of userIds this user follows
  const subs = await prisma.subscription.findMany({
    where: { subscriberId },
    select: { subscribedToId: true },
  });
  const followedIds = subs.map((s) => s.subscribedToId);

  if (followedIds.length === 0) {
    return res.status(200).json([]);
  }

  // 2) fetch all non-deleted, non-expired auctions by those users
  const now = new Date();
  const auctions = await prisma.auction.findMany({
    where: {
      userId: { in: followedIds },
      isDeleted: false,
      auctionEnd: { gt: now },
    },
    include: { user: true },
    orderBy: { dateListed: 'desc' },
  });

  return res.status(200).json(auctions);
}
