//pages\api\subscribe.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';
import { createNotification } from '@/lib/notifications';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verify(token, process.env.JWT_SECRET!) as any;
    const subscriberId = payload.userId;
    const { subscribedToId } = req.body;

    if (subscriberId === subscribedToId) {
      return res.status(400).json({ message: "You can't subscribe to yourself" });
    }

    try {
      await prisma.subscription.create({
        data: {
          subscriberId,
          subscribedToId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(400).json({ message: 'You are already subscribed to this user' });
      }
      throw err;
    }

    const subscriber = await prisma.user.findUnique({
      where: { Id: subscriberId },
      select: { Username: true, ProfileImage: true },
    });

    const message = JSON.stringify({
      type: 'follow',
      username: subscriber?.Username || 'Someone',
      profileImage: subscriber?.ProfileImage || '/default.png',
      userId: subscriberId,
    });

    await createNotification(subscribedToId, 'follow', message);

    return res.status(200).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
