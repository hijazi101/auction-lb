// pages/api/orders/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    // find the user
    const user = await prisma.user.findUnique({ where: { Email: email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // admin sees all auctions, everyone else only their wins
    const whereClause = email === 'mm@gmail.com'
      ? { isDeleted: false }                          // admin sees all non-deleted
  : { winnerId: user.Id, isDeleted: false };    // only auctions they've won

    const auctions = await prisma.auction.findMany({
      where: whereClause,           // now valid
      include: {
        user: true,
        messages: true,             // so you can compute highest bid
      },
      orderBy: { auctionEnd: 'desc' },
    });

    // map to your “order” shape...
    const orders = auctions.map(a => ({
  id: a.id,
  itemName: a.description,
  orderDate: a.auctionEnd
    ? a.auctionEnd.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
  isDelivered: a.delivered,
  winnedprice: a.winnedprice.toFixed(2), // <-- add this line
}));

    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}
