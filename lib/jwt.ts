// /lib/jwt.ts
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Replace in production

export function verifyJwt(token: string): { userId: number; email: string } {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (typeof decoded === 'object' && 'userId' in decoded && 'email' in decoded) {
      return decoded as { userId: number; email: string };
    }
    throw new Error('Invalid token payload');
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}
