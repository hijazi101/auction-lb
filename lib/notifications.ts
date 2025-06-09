//lib\notifications.ts
import { prisma } from './prisma';

export const createNotification = async (
  userId: number,
  type: string,
  message: string
) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};