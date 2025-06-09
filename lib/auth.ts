import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export const authenticate = (handler) => async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { Id: decoded.userId },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.user = user;
    return handler(req, res);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};