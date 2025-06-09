
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid order id' });
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const email = req.body.email;
  if (email !== 'mm@gmail.com') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  try {
    const auction = await prisma.auction.findUnique({ where: { id: parseInt(id, 10) } });
    if (!auction) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.auction.update({
      where: { id: parseInt(id, 10) },
      data: { delivered: !auction.delivered },
    });

    return res.status(200).json({ id: updated.id, delivered: updated.delivered });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}