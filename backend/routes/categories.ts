import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stringifyBigInt } from '../utils/bigint';

const router = express.Router();

// Create a new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orgId, keyName, externalTool, name, createdBy } = req.body;

    // Validation
    if (!orgId || !keyName || !name) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, keyName, and name are required'
      });
    }

    const category = await prisma.category.create({
      data: {
        orgId: BigInt(orgId.toString()),
        keyName,
        externalTool,
        name,
        createdBy: createdBy ? BigInt(createdBy.toString()) : null,
        updatedBy: createdBy ? BigInt(createdBy.toString()) : null,
      },
    });

    res.status(201).json(stringifyBigInt(category));
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Category with this org_id and key_name already exists'
      });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get all categories for an organization
router.get('/org/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    const categories = await prisma.category.findMany({
      where: {
        orgId: BigInt(orgId as string),
      },
      include: {
        _count: {
          select: {
            workItems: true,
            followers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(stringifyBigInt(categories));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get a single category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id: BigInt(id as string),
      },
      include: {
        workItems: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        customFieldMetaData: true,
        followers: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(stringifyBigInt(category));
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Update a category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, externalTool, updatedBy } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (externalTool !== undefined) updateData.externalTool = externalTool;
    if (updatedBy) updateData.updatedBy = BigInt(updatedBy.toString());

    const category = await prisma.category.update({
      where: {
        id: BigInt(id as string),
      },
      data: updateData,
    });

    res.json(stringifyBigInt(category));
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has work items
    const workItemCount = await prisma.workItem.count({
      where: {
        categoryId: BigInt(id as string),
      },
    });

    if (workItemCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing work items',
        workItemCount
      });
    }

    await prisma.category.delete({
      where: {
        id: BigInt(id as string),
      },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
