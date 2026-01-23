import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stringifyBigInt } from '../utils/bigint';

const router = express.Router();

// Follow a category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { categoryId, userId } = req.body;

    if (!categoryId || !userId) {
      return res.status(400).json({ error: 'Missing categoryId or userId' });
    }

    const follower = await prisma.categoryFollower.create({
      data: {
        categoryId: BigInt(categoryId.toString()),
        userId: BigInt(userId.toString()),
      },
    });

    res.status(201).json(stringifyBigInt(follower));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User already follows this category' });
    }
    console.error('Error following category:', error);
    res.status(500).json({ error: 'Failed to follow category' });
  }
});

// Unfollow a category
router.delete('/:categoryId/:userId', async (req: Request, res: Response) => {
  try {
    const { categoryId, userId } = req.params;

    await prisma.categoryFollower.delete({
      where: {
        categoryId_userId: {
          categoryId: BigInt(categoryId as string),
          userId: BigInt(userId as string),
        },
      },
    });

    res.json({ message: 'Unfollowed successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Follow record not found' });
    }
    console.error('Error unfollowing category:', error);
    res.status(500).json({ error: 'Failed to unfollow category' });
  }
});

export default router;
