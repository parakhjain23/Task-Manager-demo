const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const { analyzeTaskInput, generateChatResponse } = require('../services/aiService');

/**
 * POST /api/tasks/create
 * Create a new task using AI analysis
 */
router.post('/create', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    // Get all team members for AI analysis
    const teamMembers = await TeamMember.findMany();

    if (teamMembers.length === 0) {
      return res.status(400).json({ error: 'No team members available. Please add team members first.' });
    }

    // Use AI to analyze the input
    const taskData = await analyzeTaskInput(input, teamMembers);

    // Create the task
    const task = await Task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        assignedTo: taskData.assignedTo || null,
        dueDate: taskData.dueDate || null,
        status: taskData.status === 'in-progress' ? 'in_progress' : (taskData.status || 'pending')
      }
    });

    // Update assigned team member's workload
    if (taskData.assignedTo) {
      await TeamMember.update({
        where: { name: taskData.assignedTo },
        data: { currentWorkload: { increment: 1 } }
      });
    }

    // Generate AI response
    const aiResponse = await generateChatResponse(
      input,
      `Task created: "${taskData.title}" assigned to ${taskData.assignedTo || 'Unassigned'}`
    );

    res.json({
      success: true,
      task,
      message: aiResponse
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * Get all tasks
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update task status
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Map 'in-progress' to 'in_progress' if coming from frontend
    if (updates.status === 'in-progress') {
      updates.status = 'in_progress';
    }

    const task = await Task.update({
      where: { id },
      data: updates
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * GET /api/tasks/deleted
 * Get all deleted tasks
 */
router.get('/deleted', async (req, res) => {
  try {
    const tasks = await Task.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching deleted tasks:', error);
    res.status(500).json({ error: 'Failed to fetch deleted tasks' });
  }
});

/**
 * PUT /api/tasks/:id/recover
 * Recover a deleted task
 */
router.put('/:id/recover', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.update({
      where: { id },
      data: { isDeleted: false }
    });

    // Increase workload if assigned
    if (task.assignedTo) {
      await TeamMember.update({
        where: { name: task.assignedTo },
        data: { currentWorkload: { increment: 1 } }
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Error recovering task:', error);
    res.status(500).json({ error: 'Failed to recover task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Soft delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get task first to check assignment
    const taskToDelete = await Task.findUnique({ where: { id } });
    if (!taskToDelete) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Performance soft delete
    const task = await Task.update({
      where: { id },
      data: { isDeleted: true }
    });

    // Decrease workload of assigned team member
    if (task.assignedTo) {
      await TeamMember.update({
        where: { name: task.assignedTo },
        data: { currentWorkload: { decrement: 1 } }
      });
    }

    res.json({ success: true, message: 'Task marked as deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task with its source logs
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findUnique({
      where: { id: req.params.id },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

module.exports = router;
