import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { createNotification } from '../../../lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const method = req.method;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid or missing auction id' });
  }

  if (method === 'GET') {
    try {
      const auction = await prisma.auction.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
          user: {
            select: {
              Username: true,
              Email: true,
              ProfileImage: true,
              createdAt: true,
            },
          },
          winner: {
            select: {
              Id: true,
              Username: true,
            },
          },
        },
      });

      if (!auction) {
        return res.status(404).json({ message: 'Auction not found' });
      }

      return res.status(200).json(auction);
    } catch (error) {
      console.error('Error fetching auction:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (method === 'PATCH') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.replace('Bearer ', '');
      let decoded: any;
      try {
        decoded = verify(token, process.env.JWT_SECRET!);
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          return res
            .status(401)
            .json({ error: 'Session expired, please sign in again.' });
        }
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userId = decoded.userId as number;

      const auction = await prisma.auction.findUnique({
        where: { id: parseInt(id, 10) },
         include: { messages: true }, 
      });

      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      if (auction.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to modify this auction' });
      }

      const { isDeleted, image, description, initialPrice, status, auctionEnd } = req.body;

      const updateData: any = {};

      if (typeof isDeleted === 'boolean') {
        updateData.isDeleted = isDeleted;
      }

      if (image !== undefined) updateData.image = image;
      if (description !== undefined) updateData.description = description;
      if (initialPrice !== undefined) updateData.initialPrice = parseFloat(initialPrice);
      if (status !== undefined) updateData.status = status;

      if (auctionEnd !== undefined) {
        updateData.auctionEnd = auctionEnd ? new Date(auctionEnd) : null;

        if (auctionEnd) {
          const allMessages = await prisma.message.findMany({
            where: { auctionId: parseInt(id as string, 10) },
            select: { content: true, userId: true },
          });

          const initialPriceFloat = parseFloat(auction.initialPrice.toString());
          let highestBid = initialPriceFloat;
          let winnerUserId: number | null = null;

          allMessages.forEach((msg) => {
            const bidValue = parseFloat(msg.content);
            if (!isNaN(bidValue) && bidValue > highestBid) {
              highestBid = bidValue;
              winnerUserId = msg.userId;
              
            }
          });

          if (winnerUserId) {
            updateData.winnerId = winnerUserId;
         updateData.winnedprice = Math.floor(highestBid); 
            // Fetch winner user details for notifications
            const winnerUser = await prisma.user.findUnique({
              where: { Id: winnerUserId },
              select: { Username: true, ProfileImage: true }
            });

            if (winnerUser) {
              // Create notification for winner
              await createNotification(
                winnerUserId,
                'win',
                JSON.stringify({
                  userId: winnerUserId,
                  username: winnerUser.Username,
                  profileImage: winnerUser.ProfileImage,
                  auctionId: auction.id,
                  auctionTitle: auction.description,
                  winningPrice: highestBid.toFixed(2) // Add winning price
                })
              );

              // Create notification for auction owner
              await createNotification(
                auction.userId,
                'auction_win',
                JSON.stringify({
                  userId: winnerUserId,
                  username: winnerUser.Username,
                  profileImage: winnerUser.ProfileImage,
                  auctionId: auction.id,
                  auctionTitle: auction.description,
                  winningPrice: highestBid.toFixed(2) // Add winning price
                })
              );
            }
          } else {
            updateData.winnerId = null;
          }
        }
      }

      const updatedAuction = await prisma.auction.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
      });

      return res.status(200).json(updatedAuction);
    } catch (error) {
      console.error('PATCH auction error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}