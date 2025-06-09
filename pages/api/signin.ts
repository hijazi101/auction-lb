import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;
      console.log('Received email:', email);

      const user = await prisma.user.findUnique({
        where: { Email: email },
      });

      if (!user) {
        console.log('User not found');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare hashed password
      const passwordMatch = await bcrypt.compare(password, user.Password || '');
      if (!passwordMatch) {
        console.log('Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.Id, email: user.Email },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        token,
        user: {
          Id: user.Id,
          Email: user.Email,
          Username: user.Username,
        },
      });
    } catch (error) {
      console.error('Signin error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
