const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new category
router.post('/', async (req, res) => {
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
        orgId: BigInt(orgId),
        keyName,
        externalTool,
        name,
        createdBy: createdBy ? BigInt(createdBy) : null,
        updatedBy: createdBy ? BigInt(createdBy) : null,
      },
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      ...category,
      id: category.id.toString(),
      orgId: category.orgId.toString(),
      createdBy: category.createdBy?.toString(),
      updatedBy: category.updatedBy?.toString(),
    };

    res.status(201).json(response);
  } catch (error) {
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
router.get('/org/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;

    const categories = await prisma.category.findMany({
      where: {
        orgId: BigInt(orgId),
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

    // Convert BigInt to string for JSON serialization
    const response = categories.map(category => ({
      ...category,
      id: category.id.toString(),
      orgId: category.orgId.toString(),
      createdBy: category.createdBy?.toString(),
      updatedBy: category.updatedBy?.toString(),
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id: BigInt(id),
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

    // Convert BigInt to string for JSON serialization
    const response = {
      ...category,
      id: category.id.toString(),
      orgId: category.orgId.toString(),
      createdBy: category.createdBy?.toString(),
      updatedBy: category.updatedBy?.toString(),
      workItems: category.workItems.map(wi => ({
        ...wi,
        id: wi.id.toString(),
        categoryId: wi.categoryId.toString(),
        assigneeId: wi.assigneeId?.toString(),
        createdBy: wi.createdBy?.toString(),
        updatedBy: wi.updatedBy?.toString(),
      })),
      customFieldMetaData: category.customFieldMetaData.map(cf => ({
        ...cf,
        id: cf.id.toString(),
        orgId: cf.orgId.toString(),
        categoryId: cf.categoryId.toString(),
        createdBy: cf.createdBy?.toString(),
        updatedBy: cf.updatedBy?.toString(),
      })),
      followers: category.followers.map(f => ({
        ...f,
        id: f.id.toString(),
        categoryId: f.categoryId.toString(),
        userId: f.userId.toString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, externalTool, updatedBy } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (externalTool !== undefined) updateData.externalTool = externalTool;
    if (updatedBy) updateData.updatedBy = BigInt(updatedBy);

    const category = await prisma.category.update({
      where: {
        id: BigInt(id),
      },
      data: updateData,
    });

    // Convert BigInt to string for JSON serialization
    const response = {
      ...category,
      id: category.id.toString(),
      orgId: category.orgId.toString(),
      createdBy: category.createdBy?.toString(),
      updatedBy: category.updatedBy?.toString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has work items
    const workItemCount = await prisma.workItem.count({
      where: {
        categoryId: BigInt(id),
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
        id: BigInt(id),
      },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
