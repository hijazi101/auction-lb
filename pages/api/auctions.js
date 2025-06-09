// pages/api/auctions.js

import { PrismaClient } from '@prisma/client';
import { verify, TokenExpiredError } from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.replace('Bearer ', '');
      let decoded;
      try {
        decoded = verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          return res
            .status(401)
            .json({ error: 'Session expired, please sign in again.' });
        }
        return res.status(401).json({ error: 'Invalid token' });
      }
      const userId = decoded.userId;

      const { image, description, auctionEnd, initialPrice, isClosed, isDeleted, category  } = req.body;
      if (!image || !description || !initialPrice || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const priceNumber = parseFloat(initialPrice);
      if (isNaN(priceNumber)) {
        return res.status(400).json({ error: 'Invalid price format' });
      }

      // 1) Create the new auction (unchanged)
      const newAuction = await prisma.auction.create({
        data: {
          image,
          description,
          initialPrice: priceNumber,
          auctionEnd: auctionEnd ? new Date(auctionEnd) : null,
          category,
          userId,
          status: isClosed ? 'Closed' : 'Open',
          // isDeleted will default to false
        },
        include: {
          user: {
            select: {
              Id: true,
              Username: true,
              ProfileImage: true,
            },
          },
        },
      });

      // ────────────────────────────────────────────────────────────────────────────
      // 2) NEW: Fetch all subscribers (followers) of this auction creator
      const followers = await prisma.subscription.findMany({
        where: { subscribedToId: userId },
        include: { subscriber: true }, // so followerUser = followRelation.subscriber
      });

      // 3) NEW: Create one Notification row PER follower
      for (const followRelation of followers) {
        const followerUser = followRelation.subscriber;
        await prisma.notification.create({
          data: {
            userId: followerUser.Id,
            type: 'auction',
            // We store a JSON string in the “message” column.
            // On the frontend, we’ll parse this JSON to render username / avatar / link.
            message: JSON.stringify({
              username: newAuction.user.Username,
              profileImage: newAuction.user.ProfileImage || '/default.png',
              auctionId: newAuction.id,
            }),
          },
        });
      }
      // ────────────────────────────────────────────────────────────────────────────

      return res.status(201).json(newAuction);
    } catch (error) {
      console.error('Create auction error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (method === 'GET') {
    try {
      const search = req.query.search || '';

      const auctions = await prisma.auction.findMany({
        where: {
          isDeleted: false, // only show non-deleted auctions
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        include: {
          user: {
            select: {
              Id: true,
              Username: true,
              ProfileImage: true,
            },
          },
        },
        orderBy: { dateListed: 'desc' },
      });

      return res.status(200).json(auctions);
    } catch (error) {
      console.error('Fetch auctions error:', error);
      return res.status(500).json({ error: 'Failed to fetch auctions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
