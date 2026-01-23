const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to serialize work item log
const serializeWorkItemLog = (log) => ({
  ...log,
  id: log.id.toString(),
  workItemId: log.workItemId.toString(),
  workItem: log.workItem ? {
    ...log.workItem,
    id: log.workItem.id.toString(),
    categoryId: log.workItem.categoryId.toString(),
    assigneeId: log.workItem.assigneeId?.toString(),
    createdBy: log.workItem.createdBy?.toString(),
    updatedBy: log.workItem.updatedBy?.toString(),
  } : undefined,
});

// Create a new work item log
router.post('/', async (req, res) => {
  try {
    const {
      workItemId,
      logType,
      oldValue,
      newValue,
      message,
    } = req.body;

    // Validation
    if (!workItemId || !logType) {
      return res.status(400).json({
        error: 'Missing required fields: workItemId and logType are required'
      });
    }

    // Validate logType
    const validLogTypes = ['status_change', 'comment', 'sync', 'ai_analysis', 'field_update'];
    if (!validLogTypes.includes(logType)) {
      return res.status(400).json({
        error: `Invalid logType. Must be one of: ${validLogTypes.join(', ')}`
      });
    }

    // Check if work item exists
    const workItem = await prisma.workItem.findUnique({
      where: { id: BigInt(workItemId) },
    });

    if (!workItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    const log = await prisma.workItemLog.create({
      data: {
        workItemId: BigInt(workItemId),
        logType,
        oldValue,
        newValue,
        message,
      },
      include: {
        workItem: true,
      },
    });

    res.status(201).json(serializeWorkItemLog(log));
  } catch (error) {
    console.error('Error creating work item log:', error);
    res.status(500).json({ error: 'Failed to create work item log' });
  }
});

// Get all logs for a work item
router.get('/work-item/:workItemId', async (req, res) => {
  try {
    const { workItemId } = req.params;
    const { logType, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      workItemId: BigInt(workItemId),
    };

    if (logType) {
      where.logType = logType;
    }

    const [logs, total] = await Promise.all([
      prisma.workItemLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.workItemLog.count({ where }),
    ]);

    const response = {
      logs: logs.map(serializeWorkItemLog),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching work item logs:', error);
    res.status(500).json({ error: 'Failed to fetch work item logs' });
  }
});

// Get a single log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.workItemLog.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        workItem: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Work item log not found' });
    }

    res.json(serializeWorkItemLog(log));
  } catch (error) {
    console.error('Error fetching work item log:', error);
    res.status(500).json({ error: 'Failed to fetch work item log' });
  }
});

// Get logs by type across all work items (useful for AI analysis tracking)
router.get('/type/:logType', async (req, res) => {
  try {
    const { logType } = req.params;
    const { page = 1, limit = 50, categoryId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      logType,
    };

    // Filter by category if provided
    if (categoryId) {
      where.workItem = {
        categoryId: BigInt(categoryId),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.workItemLog.findMany({
        where,
        include: {
          workItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.workItemLog.count({ where }),
    ]);

    const response = {
      logs: logs.map(serializeWorkItemLog),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching logs by type:', error);
    res.status(500).json({ error: 'Failed to fetch logs by type' });
  }
});

// Delete a log
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.workItemLog.delete({
      where: {
        id: BigInt(id),
      },
    });

    res.json({ message: 'Work item log deleted successfully' });
  } catch (error) {
    console.error('Error deleting work item log:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Work item log not found' });
    }
    res.status(500).json({ error: 'Failed to delete work item log' });
  }
});

// Get activity timeline for a category (all logs for work items in that category)
router.get('/category/:categoryId/timeline', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 50, logType } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      workItem: {
        categoryId: BigInt(categoryId),
      },
    };

    if (logType) {
      where.logType = logType;
    }

    const [logs, total] = await Promise.all([
      prisma.workItemLog.findMany({
        where,
        include: {
          workItem: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.workItemLog.count({ where }),
    ]);

    const response = {
      logs: logs.map(serializeWorkItemLog),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category timeline:', error);
    res.status(500).json({ error: 'Failed to fetch category timeline' });
  }
});

module.exports = router;
