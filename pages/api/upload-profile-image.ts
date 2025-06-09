// pages/api/upload-profile-image.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // ✅ Corrected import
import { IncomingForm } from 'formidable'; // ✅ Correct usage
import fs from 'fs';
import path from 'path';
import { verifyJwt } from '@/lib/jwt'; // ✅ Make sure this file exists

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  let userId: number;
  try {
    const payload = verifyJwt(token);
    userId = payload.userId;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const form = new IncomingForm(); // ✅ Correct constructor usage
  form.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Upload failed' });

    const file = Array.isArray(files.file) ? files.file[0] : files.file; // ✅ Support multiple file structures
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const oldPath = file.filepath || file.path;
    const fileName = path.basename(oldPath);
    const newPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    try {
      fs.renameSync(oldPath, newPath);
    } catch (moveErr) {
      console.error('Error moving file:', moveErr);
      return res.status(500).json({ message: 'File save error' });
    }

    const imageUrl = `/uploads/${fileName}`;

    try {
      await prisma.user.update({
        where: { Id: userId },
        data: { ProfileImage: imageUrl },
      });
      return res.status(200).json({ imageUrl });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to update profile image' });
    }
  });
}
