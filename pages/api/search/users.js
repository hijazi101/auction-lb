import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/search/users?q=someUsername
 *
 * Returns a JSON array of users whose Username contains `q` (case-insensitive).
 * For each user, we include:
 *  - Id
 *  - Username
 *  - ProfileImage
 *  - _count.subscriptions  (number of users they follow)
 *  - _count.subscribers    (number of users who follow them)
 *
 * Response schema:
 * [
 *   {
 *     Id: number,
 *     Username: string | null,
 *     ProfileImage: string | null,
 *     followingCount: number,   // subscriptions count
 *     followerCount: number     // subscribers count
 *   },
 *   ...
 * ]
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { q = '' } = req.query;
    const searchTerm = String(q);

    // If no q or empty, we can return an empty list or all users. Here, we'll return an empty list.
    if (!searchTerm.trim()) {
      return res.status(200).json([]);
    }

    // Find all users with Username containing the search term (case-insensitive).
    const users = await prisma.user.findMany({
      where: {
        Username: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        Id: true,
        Username: true,
        ProfileImage: true,
        _count: {
          select: {
            subscriptions: true, // how many this user is following
            subscribers: true,   // how many followers this user has
          },
        },
      },
      orderBy: {
        Username: 'asc',
      },
    });

    // Map into desired JSON shape
    const result = users.map((u) => ({
      Id: u.Id,
      Username: u.Username,
      ProfileImage: u.ProfileImage,
      followingCount: u._count.subscriptions,
      followerCount: u._count.subscribers,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/search/users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
