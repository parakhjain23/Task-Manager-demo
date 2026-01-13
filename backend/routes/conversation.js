const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const { detectTaskIntent } = require('../services/aiService');

/**
 * POST /api/conversation
 * Handle conversational task creation
 */
router.post('/', async (req, res) => {
  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required' });
    }

    // Get all team members for task assignment
    const teamMembers = await TeamMember.find();

    // Detect intent and get AI response
    const result = await detectTaskIntent(conversationHistory, teamMembers);

    // If AI decides to create a task
    if (result.shouldCreateTask && result.taskData) {
      // Ensure required fields
      if (!result.taskData.title || !result.taskData.description) {
        return res.json({
          response: result.response,
          shouldCreateTask: false,
          needsMoreInfo: true
        });
      }

      // Set defaults for optional fields
      const taskData = {
        title: result.taskData.title,
        description: result.taskData.description,
        priority: result.taskData.priority || 'medium',
        tags: result.taskData.tags || [],
        assignedTo: result.taskData.assignedTo || null,
        dueDate: result.taskData.dueDate || null
      };

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

      return res.json({
        response: result.response,
        shouldCreateTask: true,
        task: task,
        needsMoreInfo: false
      });
    }

    // Just conversing, no task creation
    res.json({
      response: result.response,
      shouldCreateTask: false,
      needsMoreInfo: result.needsMoreInfo || false
    });

  } catch (error) {
    console.error('Error in conversation:', error);
    res.status(500).json({
      error: error.message || 'Failed to process conversation',
      response: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

module.exports = router;
