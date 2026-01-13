const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { analyzeViewRequest } = require('../services/aiService');

/**
 * Build MongoDB filter from AI-analyzed criteria
 */
function buildMongoFilter(filters) {
  const mongoFilter = {};

  // Status filter
  if (filters.status) {
    mongoFilter.status = filters.status;
  }

  // Priority filter
  if (filters.priority) {
    mongoFilter.priority = filters.priority;
  }

  // Assigned to filter
  if (filters.assignedTo) {
    mongoFilter.assignedTo = filters.assignedTo;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    mongoFilter.tags = { $in: filters.tags };
  }

  // Date-based filters
  const now = new Date();

  // Created today
  if (filters.createdToday) {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    mongoFilter.createdAt = { $gte: startOfToday, $lte: endOfToday };
  }

  // Created this week
  if (filters.createdThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    mongoFilter.createdAt = { $gte: startOfWeek };
  }

  // Created within X days
  if (filters.createdWithinDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.createdWithinDays);
    mongoFilter.createdAt = { $gte: daysAgo };
  }

  // Due this week
  if (filters.dueThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    mongoFilter.dueDate = { $gte: startOfWeek, $lte: endOfWeek };
  }

  // Due within X days
  if (filters.dueWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
    mongoFilter.dueDate = { $lte: futureDate };
  }

  return mongoFilter;
}

/**
 * POST /api/dynamic-view
 * Create a dynamic view based on natural language query
 */
router.post('/', async (req, res) => {
  try {
    const { query, currentUser } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use AI to analyze the view request
    const analysisResult = await analyzeViewRequest(query);

    // Replace "me" with actual username if provided
    if (analysisResult.filters.assignedTo === 'me' && currentUser) {
      analysisResult.filters.assignedTo = currentUser;
    } else if (analysisResult.filters.assignedTo === 'me' && !currentUser) {
      // If "me" but no user provided, remove filter
      analysisResult.filters.assignedTo = null;
    }

    // Build MongoDB filter
    const mongoFilter = buildMongoFilter(analysisResult.filters);

    // Query tasks
    const tasks = await Task.find(mongoFilter).sort({ createdAt: -1 });

    res.json({
      viewName: analysisResult.viewName,
      filters: analysisResult.filters,
      tasks: tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Error creating dynamic view:', error);
    res.status(500).json({ error: 'Failed to create dynamic view', details: error.message });
  }
});

module.exports = router;
