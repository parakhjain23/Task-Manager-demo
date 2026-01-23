const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to serialize category follower
const serializeCategoryFollower = (follower) => ({
  ...follower,
  id: follower.id.toString(),
  categoryId: follower.categoryId.toString(),
  userId: follower.userId.toString(),
  category: follower.category ? {
    ...follower.category,
    id: follower.category.id.toString(),
    orgId: follower.category.orgId.toString(),
    createdBy: follower.category.createdBy?.toString(),
    updatedBy: follower.category.updatedBy?.toString(),
  } : undefined,
});

// Follow a category
router.post('/', async (req, res) => {
  try {
    const { categoryId, userId } = req.body;

    // Validation
    if (!categoryId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: categoryId and userId are required'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if already following
    const existingFollow = await prisma.categoryFollower.findUnique({
      where: {
        categoryId_userId: {
          categoryId: BigInt(categoryId),
          userId: BigInt(userId),
        },
      },
    });

    if (existingFollow) {
      return res.status(409).json({
        error: 'User is already following this category'
      });
    }

    const follower = await prisma.categoryFollower.create({
      data: {
        categoryId: BigInt(categoryId),
        userId: BigInt(userId),
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(serializeCategoryFollower(follower));
  } catch (error) {
    console.error('Error following category:', error);
    res.status(500).json({ error: 'Failed to follow category' });
  }
});

// Unfollow a category
router.delete('/', async (req, res) => {
  try {
    const { categoryId, userId } = req.body;

    // Validation
    if (!categoryId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: categoryId and userId are required'
      });
    }

    await prisma.categoryFollower.delete({
      where: {
        categoryId_userId: {
          categoryId: BigInt(categoryId),
          userId: BigInt(userId),
        },
      },
    });

    res.json({ message: 'Successfully unfollowed category' });
  } catch (error) {
    console.error('Error unfollowing category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }
    res.status(500).json({ error: 'Failed to unfollow category' });
  }
});

// Get all followers for a category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [followers, total] = await Promise.all([
      prisma.categoryFollower.findMany({
        where: {
          categoryId: BigInt(categoryId),
        },
        orderBy: {
          followedAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.categoryFollower.count({
        where: {
          categoryId: BigInt(categoryId),
        },
      }),
    ]);

    const response = {
      followers: followers.map(serializeCategoryFollower),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category followers:', error);
    res.status(500).json({ error: 'Failed to fetch category followers' });
  }
});

// Get all categories followed by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { orgId, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      userId: BigInt(userId),
    };

    // Filter by organization if provided
    if (orgId) {
      where.category = {
        orgId: BigInt(orgId),
      };
    }

    const [followers, total] = await Promise.all([
      prisma.categoryFollower.findMany({
        where,
        include: {
          category: {
            include: {
              _count: {
                select: {
                  workItems: true,
                },
              },
            },
          },
        },
        orderBy: {
          followedAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.categoryFollower.count({ where }),
    ]);

    const response = {
      followers: followers.map(serializeCategoryFollower),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user followed categories:', error);
    res.status(500).json({ error: 'Failed to fetch user followed categories' });
  }
});

// Check if a user is following a category
router.get('/check', async (req, res) => {
  try {
    const { categoryId, userId } = req.query;

    if (!categoryId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: categoryId and userId are required'
      });
    }

    const follower = await prisma.categoryFollower.findUnique({
      where: {
        categoryId_userId: {
          categoryId: BigInt(categoryId),
          userId: BigInt(userId),
        },
      },
    });

    res.json({
      isFollowing: !!follower,
      followedAt: follower?.followedAt,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get follower count for multiple categories (bulk operation)
router.post('/bulk/count', async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        error: 'categoryIds must be a non-empty array'
      });
    }

    const counts = await Promise.all(
      categoryIds.map(async (categoryId) => {
        const count = await prisma.categoryFollower.count({
          where: {
            categoryId: BigInt(categoryId),
          },
        });
        return {
          categoryId: categoryId.toString(),
          followerCount: count,
        };
      })
    );

    res.json(counts);
  } catch (error) {
    console.error('Error fetching bulk follower counts:', error);
    res.status(500).json({ error: 'Failed to fetch bulk follower counts' });
  }
});

module.exports = router;
