const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const { detectTaskIntent } = require('../services/aiService');

/**
 * POST /api/conversation
 * Handle conversational interaction and detect task intent using AI
 */
router.post('/', async (req, res) => {
  try {
    const { conversationHistory, selectedTaskId } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required' });
    }

    // Extract user's last message for logging
    const lastUserMessage = conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Create a log in database IMMEDIATELY
    // Setting isClassified: false will trigger the background LogClassifier service
    const log = await Log.create({
      data: {
        userInput: lastUserMessage,
        aiResponse: null, // Will be filled by background service
        isClassified: false,
        isTask: false,
        taskId: null,
        conversationContext: JSON.stringify(conversationHistory), // Store full history for AI context
        selectedTaskId: selectedTaskId || null
      }
    });

    // Return response to user immediately for fast UI feedback
    res.json({
      log: log,
      status: 'queued'
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
