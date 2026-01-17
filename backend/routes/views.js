const express = require('express');
const router = express.Router();
const View = require('../models/View');
const Task = require('../models/Task');

/**
 * GET /api/views
 * Get all saved views
 */
router.get('/', async (req, res) => {
  try {
    const views = await View.findMany({
      orderBy: { lastUsed: 'desc' }
    });
    res.json(views);
  } catch (error) {
    console.error('Error fetching views:', error);
    res.status(500).json({ error: 'Failed to fetch views' });
  }
});

/**
 * POST /api/views
 * Save a new custom view
 */
router.post('/', async (req, res) => {
  try {
    const { name, query, filters } = req.body;

    if (!name || !query) {
      return res.status(400).json({ error: 'Name and query are required' });
    }

    // Check if view with same name already exists
    const existingView = await View.findFirst({ where: { name } });
    if (existingView) {
      return res.status(400).json({ error: 'A view with this name already exists' });
    }

    const view = await View.create({
      data: {
        name,
        query,
        filters: filters || {}
      }
    });

    res.status(201).json(view);
  } catch (error) {
    console.error('Error saving view:', error);
    res.status(500).json({ error: 'Failed to save view' });
  }
});

/**
 * GET /api/views/:id
 * Get a specific view and execute it
 */
router.get('/:id', async (req, res) => {
  try {
    const view = await View.findUnique({ where: { id: req.params.id } });

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Update lastUsed timestamp
    await View.update({
      where: { id: view.id },
      data: { lastUsed: new Date() }
    });

    // Build Prisma filter from saved filters
    const prismaFilter = buildPrismaFilter(view.filters);

    // Query tasks
    const tasks = await Task.findMany({
      where: prismaFilter,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      view: view,
      tasks: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error executing view:', error);
    res.status(500).json({ error: 'Failed to execute view' });
  }
});

/**
 * DELETE /api/views/:id
 * Delete a saved view
 */
router.delete('/:id', async (req, res) => {
  try {
    const view = await View.delete({
      where: { id: req.params.id }
    });

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    res.json({ message: 'View deleted successfully' });
  } catch (error) {
    console.error('Error deleting view:', error);
    res.status(500).json({ error: 'Failed to delete view' });
  }
});

/**
 * PUT /api/views/:id
 * Update a saved view
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, query, filters } = req.body;

    const view = await View.update({
      where: { id: req.params.id },
      data: { name, query, filters, lastUsed: new Date() }
    });

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    res.json(view);
  } catch (error) {
    console.error('Error updating view:', error);
    res.status(500).json({ error: 'Failed to update view' });
  }
});

/**
 * Helper function to build Prisma filter from saved filters
 */
function buildPrismaFilter(filters) {
  const prismaFilter = { isDeleted: false };

  if (filters.status) {
    prismaFilter.status = filters.status === 'in-progress' ? 'in_progress' : filters.status;
  }

  if (filters.priority) {
    prismaFilter.priority = filters.priority;
  }

  if (filters.assignedTo) {
    prismaFilter.assignedTo = filters.assignedTo;
  }

  if (filters.tags && filters.tags.length > 0) {
    prismaFilter.tags = { hasSome: filters.tags };
  }

  const now = new Date();

  if (filters.createdToday) {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    prismaFilter.createdAt = { gte: startOfToday, lte: endOfToday };
  }

  if (filters.createdThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    prismaFilter.createdAt = { gte: startOfWeek };
  }

  if (filters.createdWithinDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.createdWithinDays);
    prismaFilter.createdAt = { gte: daysAgo };
  }

  if (filters.dueThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    prismaFilter.dueDate = { gte: startOfWeek, lte: endOfWeek };
  }

  if (filters.dueWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
    prismaFilter.dueDate = { lte: futureDate };
  }

  return prismaFilter;
}

module.exports = router;
