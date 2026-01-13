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
    const views = await View.find().sort({ lastUsed: -1 });
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
    const existingView = await View.findOne({ name });
    if (existingView) {
      return res.status(400).json({ error: 'A view with this name already exists' });
    }

    const view = new View({
      name,
      query,
      filters
    });

    await view.save();
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
    const view = await View.findById(req.params.id);

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Update lastUsed timestamp
    view.lastUsed = new Date();
    await view.save();

    // Build MongoDB filter from saved filters
    const mongoFilter = buildMongoFilter(view.filters);

    // Query tasks
    const tasks = await Task.find(mongoFilter).sort({ createdAt: -1 });

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
    const view = await View.findByIdAndDelete(req.params.id);

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

    const view = await View.findByIdAndUpdate(
      req.params.id,
      { name, query, filters, lastUsed: new Date() },
      { new: true }
    );

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
 * Helper function to build MongoDB filter from saved filters
 */
function buildMongoFilter(filters) {
  const mongoFilter = {};

  if (filters.status) {
    mongoFilter.status = filters.status;
  }

  if (filters.priority) {
    mongoFilter.priority = filters.priority;
  }

  if (filters.assignedTo) {
    mongoFilter.assignedTo = filters.assignedTo;
  }

  if (filters.tags && filters.tags.length > 0) {
    mongoFilter.tags = { $in: filters.tags };
  }

  const now = new Date();

  if (filters.createdToday) {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    mongoFilter.createdAt = { $gte: startOfToday, $lte: endOfToday };
  }

  if (filters.createdThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    mongoFilter.createdAt = { $gte: startOfWeek };
  }

  if (filters.createdWithinDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.createdWithinDays);
    mongoFilter.createdAt = { $gte: daysAgo };
  }

  if (filters.dueThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    mongoFilter.dueDate = { $gte: startOfWeek, $lte: endOfWeek };
  }

  if (filters.dueWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
    mongoFilter.dueDate = { $lte: futureDate };
  }

  return mongoFilter;
}

module.exports = router;
