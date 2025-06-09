// pages/api/notifications.js

import { PrismaClient } from '@prisma/client';
import { verify, TokenExpiredError } from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  // ─── Handle POST: create a new notification ───────────────────────────
 if (method === 'POST') {
    // 1) Check Authorization header
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

    // 2) Parse request body for new notification data
    // Expecting JSON: { type: string, message: string }
    const { type, message } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: 'Missing type or message' });
    }

    // 3) Create notification row
    try {
      const created = await prisma.notification.create({
        data: {
         userId,
          type,
          message,
        },
      });
      return res.status(201).json(created);
    } catch (error) {
      console.error('Create notification error:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Check Authorization header
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

  // 2) Fetch all notifications for this user, most recent first
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      // Pull only the fields we care about
      select: {
        id: true,
        message: true,     // this is a JSON‐string we stored
        type: true,        // e.g. 'auction' or 'win'
        createdAt: true,
        isRead: true,
      },
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}
