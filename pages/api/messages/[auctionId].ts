//pages\api\messages\[auctionId].ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { content, auctionId, userId } = req.body;

      const bid = parseFloat(content);
      if (isNaN(bid)) {
        return res.status(400).json({ error: 'Invalid bid amount' });
      }

      const auction = await prisma.auction.findUnique({
        where: { id: parseInt(auctionId) },
      });

      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      // Get user's previous bids for this auction
      const userBids = await prisma.message.findMany({
        where: {
          auctionId: parseInt(auctionId),
          userId: parseInt(userId),
        },
        select: { content: true },
      });

      const userBidValues = userBids.map(msg => parseFloat(msg.content)).filter(bid => !isNaN(bid));
      const userMaxBid = userBidValues.length > 0 ? Math.max(...userBidValues) : 0;

      // Get all bids for the auction
      const allBids = await prisma.message.findMany({
        where: { auctionId: parseInt(auctionId) },
        select: { content: true },
      });

      const numericBids = allBids
        .map(msg => parseFloat(msg.content))
        .filter(bid => !isNaN(bid));
      const maxBid = numericBids.length > 0 ? Math.max(...numericBids) : parseFloat(auction.initialPrice);

      if (auction.status === 'Closed') {
        if (userMaxBid > 0) {
          return res.status(400).json({ error: 'You have already placed a bid on this closed auction' });
        }
        if (bid <= parseFloat(auction.initialPrice)) {
          return res.status(400).json({ error: 'Bid must be greater than initial price for closed auctions' });
        }
      } else if (auction.status === 'Open') {
        if (bid <= parseFloat(auction.initialPrice)) {
          return res.status(400).json({ error: 'Bid must be greater than initial price' });
        }
        if (bid <= maxBid) {
          return res.status(400).json({ error: 'Bid must be greater than current highest bid' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid auction status' });
      }

      const message = await prisma.message.create({
        data: {
          content: bid.toFixed(2),
          auctionId: parseInt(auctionId),
          userId: parseInt(userId),
        },
      });

      return res.status(201).json(message);
    } else if (req.method === 'GET') {
      const { auctionId } = req.query;

      const messages = await prisma.message.findMany({
        where: { auctionId: parseInt(auctionId) },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json(messages);
    } else {
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}