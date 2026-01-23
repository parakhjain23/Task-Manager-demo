const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to convert BigInt fields to strings
const serializeWorkItem = (workItem) => ({
  ...workItem,
  id: workItem.id.toString(),
  categoryId: workItem.categoryId.toString(),
  assigneeId: workItem.assigneeId?.toString(),
  createdBy: workItem.createdBy?.toString(),
  updatedBy: workItem.updatedBy?.toString(),
  category: workItem.category ? {
    ...workItem.category,
    id: workItem.category.id.toString(),
    orgId: workItem.category.orgId.toString(),
    createdBy: workItem.category.createdBy?.toString(),
    updatedBy: workItem.category.updatedBy?.toString(),
  } : undefined,
  logs: workItem.logs?.map(log => ({
    ...log,
    id: log.id.toString(),
    workItemId: log.workItemId.toString(),
  })),
  customFieldValues: workItem.customFieldValues?.map(cfv => ({
    ...cfv,
    id: cfv.id.toString(),
    workItemId: cfv.workItemId.toString(),
    customFieldMetaDataId: cfv.customFieldMetaDataId.toString(),
    valueNumber: cfv.valueNumber?.toString(),
  })),
});

// Create a new work item
router.post('/', async (req, res) => {
  try {
    const {
      externalId,
      categoryId,
      title,
      description,
      status,
      priority,
      assigneeId,
      createdBy,
      startDate,
      dueDate,
      customFields,
    } = req.body;

    // Validation
    if (!categoryId || !title) {
      return res.status(400).json({
        error: 'Missing required fields: categoryId and title are required'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create work item
    const workItem = await prisma.workItem.create({
      data: {
        externalId,
        categoryId: BigInt(categoryId),
        title,
        description,
        status: status || 'CAPTURED',
        priority,
        assigneeId: assigneeId ? BigInt(assigneeId) : null,
        createdBy: createdBy ? BigInt(createdBy) : null,
        updatedBy: createdBy ? BigInt(createdBy) : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        category: true,
      },
    });

    // Create initial log
    await prisma.workItemLog.create({
      data: {
        workItemId: workItem.id,
        logType: 'ai_analysis',
        message: 'Work item created',
      },
    });

    // Handle custom fields if provided
    if (customFields && Array.isArray(customFields)) {
      for (const field of customFields) {
        const { customFieldMetaDataId, value, calculatedBy } = field;

        const metaData = await prisma.customFieldMetaData.findUnique({
          where: { id: BigInt(customFieldMetaDataId) },
        });

        if (metaData) {
          const valueData = {
            workItemId: workItem.id,
            customFieldMetaDataId: BigInt(customFieldMetaDataId),
            calculatedBy: calculatedBy || 'user',
          };

          // Set value based on data type
          switch (metaData.dataType) {
            case 'number':
              valueData.valueNumber = value;
              break;
            case 'text':
              valueData.valueText = value;
              break;
            case 'boolean':
              valueData.valueBoolean = value;
              break;
            case 'json':
              valueData.valueJson = value;
              break;
          }

          await prisma.customFieldValue.create({ data: valueData });
        }
      }
    }

    // Fetch complete work item with relations
    const completeWorkItem = await prisma.workItem.findUnique({
      where: { id: workItem.id },
      include: {
        category: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        customFieldValues: {
          include: {
            customFieldMetaData: true,
          },
        },
      },
    });

    res.status(201).json(serializeWorkItem(completeWorkItem));
  } catch (error) {
    console.error('Error creating work item:', error);
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// Get all work items with filters
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      status,
      priority,
      assigneeId,
      orgId,
      page = 1,
      limit = 50,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (categoryId) {
      where.categoryId = BigInt(categoryId);
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = BigInt(assigneeId);
    }

    if (orgId) {
      where.category = {
        orgId: BigInt(orgId),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [workItems, total] = await Promise.all([
      prisma.workItem.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: {
              logs: true,
              customFieldValues: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.workItem.count({ where }),
    ]);

    const response = {
      workItems: workItems.map(serializeWorkItem),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching work items:', error);
    res.status(500).json({ error: 'Failed to fetch work items' });
  }
});

// Get a single work item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workItem = await prisma.workItem.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        category: true,
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        customFieldValues: {
          include: {
            customFieldMetaData: true,
          },
        },
      },
    });

    if (!workItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    res.json(serializeWorkItem(workItem));
  } catch (error) {
    console.error('Error fetching work item:', error);
    res.status(500).json({ error: 'Failed to fetch work item' });
  }
});

// Update a work item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      updatedBy,
      startDate,
      dueDate,
      externalId,
    } = req.body;

    // Fetch current work item for logging changes
    const currentWorkItem = await prisma.workItem.findUnique({
      where: { id: BigInt(id) },
    });

    if (!currentWorkItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? BigInt(assigneeId) : null;
    if (updatedBy !== undefined) updateData.updatedBy = BigInt(updatedBy);
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (externalId !== undefined) updateData.externalId = externalId;

    const workItem = await prisma.workItem.update({
      where: {
        id: BigInt(id),
      },
      data: updateData,
      include: {
        category: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        customFieldValues: {
          include: {
            customFieldMetaData: true,
          },
        },
      },
    });

    // Log status change if status was updated
    if (status && status !== currentWorkItem.status) {
      await prisma.workItemLog.create({
        data: {
          workItemId: workItem.id,
          logType: 'status_change',
          oldValue: currentWorkItem.status,
          newValue: status,
          message: `Status changed from ${currentWorkItem.status} to ${status}`,
        },
      });
    }

    // Log other field updates
    const changedFields = [];
    if (title && title !== currentWorkItem.title) changedFields.push('title');
    if (description && description !== currentWorkItem.description) changedFields.push('description');
    if (priority && priority !== currentWorkItem.priority) changedFields.push('priority');

    if (changedFields.length > 0) {
      await prisma.workItemLog.create({
        data: {
          workItemId: workItem.id,
          logType: 'field_update',
          message: `Updated fields: ${changedFields.join(', ')}`,
        },
      });
    }

    res.json(serializeWorkItem(workItem));
  } catch (error) {
    console.error('Error updating work item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work item not found' });
    }
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// Delete a work item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related records first
    await prisma.customFieldValue.deleteMany({
      where: { workItemId: BigInt(id) },
    });

    await prisma.workItemLog.deleteMany({
      where: { workItemId: BigInt(id) },
    });

    await prisma.workItem.delete({
      where: {
        id: BigInt(id),
      },
    });

    res.json({ message: 'Work item deleted successfully' });
  } catch (error) {
    console.error('Error deleting work item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work item not found' });
    }
    res.status(500).json({ error: 'Failed to delete work item' });
  }
});

module.exports = router;
