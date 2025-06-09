//pages\api\subscribers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { subscribedToId: Number(userId) },
      include: { subscriber: true },
    });

    const subscribers = subscriptions.map((sub) => sub.subscriber);
    res.status(200).json(subscribers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
