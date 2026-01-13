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
    const teamMembers = await TeamMember.find();

    if (teamMembers.length === 0) {
      return res.status(400).json({ error: 'No team members available. Please add team members first.' });
    }

    // Use AI to analyze the input
    const taskData = await analyzeTaskInput(input, teamMembers);

    // Create the task
    const task = new Task(taskData);
    await task.save();

    // Update assigned team member's workload
    if (taskData.assignedTo) {
      await TeamMember.findOneAndUpdate(
        { name: taskData.assignedTo },
        { $inc: { currentWorkload: 1 } }
      );
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
    const tasks = await Task.find().sort({ createdAt: -1 });
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

    const task = await Task.findByIdAndUpdate(id, updates, { new: true });

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
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Decrease workload of assigned team member
    if (task.assignedTo) {
      await TeamMember.findOneAndUpdate(
        { name: task.assignedTo },
        { $inc: { currentWorkload: -1 } }
      );
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
