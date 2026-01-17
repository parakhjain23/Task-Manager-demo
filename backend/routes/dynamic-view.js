const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { analyzeViewRequest } = require('../services/aiService');

/**
 * Build Prisma filter from AI-analyzed criteria
 */
function buildPrismaFilter(filters) {
  const prismaFilter = {};

  // Status filter (Map in-progress to in_progress)
  if (filters.status) {
    prismaFilter.status = filters.status === 'in-progress' ? 'in_progress' : filters.status;
  }

  // Priority filter
  if (filters.priority) {
    prismaFilter.priority = filters.priority;
  }

  // Assigned to filter
  if (filters.assignedTo) {
    prismaFilter.assignedTo = filters.assignedTo;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    prismaFilter.tags = { hasSome: filters.tags };
  }

  // Date-based filters
  const now = new Date();

  // Created today
  if (filters.createdToday) {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    prismaFilter.createdAt = { gte: startOfToday, lte: endOfToday };
  }

  // Created this week
  if (filters.createdThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    prismaFilter.createdAt = { gte: startOfWeek };
  }

  // Created within X days
  if (filters.createdWithinDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.createdWithinDays);
    prismaFilter.createdAt = { gte: daysAgo };
  }

  // Due this week
  if (filters.dueThisWeek) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    prismaFilter.dueDate = { gte: startOfWeek, lte: endOfWeek };
  }

  // Due within X days
  if (filters.dueWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
    prismaFilter.dueDate = { lte: futureDate };
  }

  return prismaFilter;
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

    // Build Prisma filter
    const prismaFilter = buildPrismaFilter(analysisResult.filters);

    // Query tasks
    const tasks = await Task.findMany({
      where: prismaFilter,
      orderBy: { createdAt: 'desc' }
    });

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
