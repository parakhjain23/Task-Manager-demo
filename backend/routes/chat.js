const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../services/aiService');

/**
 * POST /api/chat
 * Handle general chat messages
 */
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await generateChatResponse(message, context);

    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;
