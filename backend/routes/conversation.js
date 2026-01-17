const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

/**
 * POST /api/conversation
 * Handle conversational interaction and create logs directly without AI
 */
router.post('/', async (req, res) => {
  try {
    const { conversationHistory, selectedTaskId } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Conversation history is required' });
    }

    // Extract user's last message
    const lastUserMessage = conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Create a log directly in database
    const log = await Log.create({
      data: {
        userInput: lastUserMessage,
        isClassified: true, // Mark as classified since we're not using background processing
        isTask: false,
        conversationContext: conversationHistory.length > 1 ? 'multi-turn' : 'single-turn',
        selectedTaskId: selectedTaskId || null
      }
    });

    // Return response to user
    res.json({
      log: log
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
