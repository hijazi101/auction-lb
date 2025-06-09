import { z } from 'zod';

export const auctionSchema = z.object({
  image: z.string().url({ message: 'Invalid image URL' }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  initialPrice: z.number().min(1, 'Minimum price is $1'),
});

// Use in API route:
// const validated = auctionSchema.safeParse(req.body);
// if (!validated.success) return res.status(400).json({ errors: validated.error.errors });