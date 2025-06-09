import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const existing = await prisma.user.findUnique({ where: { Email: email } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      Email: email,
      Username: username,
      Password: hashed,
      Balance: '0',
    },
  });

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '7d' });

  res.status(201).json({ token });
}
