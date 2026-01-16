const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const Log = require('../models/Log');
const { detectTaskIntent } = require('../services/aiService');

/**
 * POST /api/conversation
 * Handle conversational interaction and create logs
 */
router.post('/', async (req, res) => {
  try {
    const { conversationHistory, selectedTaskId } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required' });
    }

    // Get all team members for context
    const teamMembers = await TeamMember.find();

    // Detect intent and get AI response
    const result = await detectTaskIntent(conversationHistory, teamMembers);

    // Extract user's last message
    const lastUserMessage = conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Create a log with the AI response
    const log = new Log({
      userInput: lastUserMessage,
      aiResponse: result.response,
      isClassified: false,
      isTask: false,
      metadata: {
        selectedTaskId: selectedTaskId || null,
        conversationContext: conversationHistory.length > 1 ? 'multi-turn' : 'single-turn'
      }
    });

    await log.save();

    // Return response to user (task will be created by background classifier)
    res.json({
      response: result.response,
      log: log,
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
