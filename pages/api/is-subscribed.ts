import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { subscriberId, subscribedToId } = req.query;

  if (!subscriberId || !subscribedToId) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const existing = await prisma.subscription.findUnique({
    where: {
      subscriberId_subscribedToId: {
        subscriberId: Number(subscriberId),
        subscribedToId: Number(subscribedToId),
      },
    },
  });

  res.status(200).json({ subscribed: !!existing });
}
