import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stringifyBigInt } from '../utils/bigint';

const router = express.Router();

// Create a new work item
router.post('/', async (req: Request, res: Response) => {
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
      where: { id: BigInt(categoryId.toString()) },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create work item
    const workItem = await prisma.workItem.create({
      data: {
        externalId,
        categoryId: BigInt(categoryId.toString()),
        title,
        description,
        status: status || 'CAPTURED',
        priority,
        assigneeId: assigneeId ? BigInt(assigneeId.toString()) : null,
        createdBy: createdBy ? BigInt(createdBy.toString()) : null,
        updatedBy: createdBy ? BigInt(createdBy.toString()) : null,
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
          where: { id: BigInt(customFieldMetaDataId.toString()) },
        });

        if (metaData) {
          const valueData: any = {
            workItemId: workItem.id,
            customFieldMetaDataId: BigInt(customFieldMetaDataId.toString()),
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

    res.status(201).json(stringifyBigInt(completeWorkItem));
  } catch (error) {
    console.error('Error creating work item:', error);
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// Get all work items with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      status,
      priority,
      assigneeId,
      orgId,
      page = '1',
      limit = '50',
      search,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (categoryId) {
      where.categoryId = BigInt(categoryId.toString());
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = BigInt(assigneeId.toString());
    }

    if (orgId) {
      where.category = {
        orgId: BigInt(orgId.toString()),
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
      workItems: stringifyBigInt(workItems),
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workItem = await prisma.workItem.findUnique({
      where: {
        id: BigInt(id as string),
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

    res.json(stringifyBigInt(workItem));
  } catch (error) {
    console.error('Error fetching work item:', error);
    res.status(500).json({ error: 'Failed to fetch work item' });
  }
});

// Update a work item
router.put('/:id', async (req: Request, res: Response) => {
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
      where: { id: BigInt(id as string) },
    });

    if (!currentWorkItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? BigInt(assigneeId.toString()) : null;
    if (updatedBy !== undefined) updateData.updatedBy = BigInt(updatedBy.toString());
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (externalId !== undefined) updateData.externalId = externalId;

    const workItem = await prisma.workItem.update({
      where: {
        id: BigInt(id as string),
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
    const changedFields: string[] = [];
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

    res.json(stringifyBigInt(workItem));
  } catch (error: any) {
    console.error('Error updating work item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work item not found' });
    }
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// Delete a work item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete related records first
    await prisma.customFieldValue.deleteMany({
      where: { workItemId: BigInt(id as string) },
    });

    await prisma.workItemLog.deleteMany({
      where: { workItemId: BigInt(id as string) },
    });

    await prisma.workItem.delete({
      where: {
        id: BigInt(id as string),
      },
    });

    res.json({ message: 'Work item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting work item:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work item not found' });
    }
    res.status(500).json({ error: 'Failed to delete work item' });
  }
});

export default router;
