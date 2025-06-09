import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
  } = req;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { Id: Number(id) },
      select: {
        Id: true,
        Username: true,
        Bio: true,
        ProfileImage: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Fetch all auctions for this user, including image and status
    const allAuctions = await prisma.auction.findMany({
      where: { userId: Number(id) },
      orderBy: { dateListed: 'desc' },
      select: {
        id: true,
        image: true,
        description: true,
        initialPrice: true,
        dateListed: true,
        auctionEnd: true,
        isDeleted: true,
        status: true,
      },
    });

    const now = new Date();

    // ✅ Categorize auctions with updated conditions:
    //    - Active: auctionEnd > current time AND isDeleted == false
    //    - Ended:  auctionEnd < current time AND isDeleted == false
    //    - Draft:  isDeleted == true
    const active = allAuctions.filter(
      (a) =>
        a.auctionEnd !== null &&
        new Date(a.auctionEnd).getTime() > now.getTime() &&
        a.isDeleted === false
    );
    const history = allAuctions.filter(
      (a) =>
        a.auctionEnd !== null &&
        new Date(a.auctionEnd).getTime() < now.getTime() &&
        a.isDeleted === false
    );
    const draft = allAuctions.filter((a) => a.isDeleted === true);

    return res.status(200).json({
      ...user,
      auctions: {
        active,
        history,
        draft,
      },
    });
  } catch (error) {
    console.error('API /public-profile/[id] error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
