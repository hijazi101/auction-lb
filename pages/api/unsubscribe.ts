import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = verify(token, process.env.JWT_SECRET!) as any;
    const subscriberId = payload.userId;
    const { subscribedToId } = req.body;

    await prisma.subscription.delete({
      where: {
        subscriberId_subscribedToId: {
          subscriberId,
          subscribedToId,
        },
      },
    });

    return res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
