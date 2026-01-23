import express, { Request, Response } from 'express';
import { generateChatResponse } from '../services/aiService';

const router = express.Router();

/**
 * POST /api/chat
 * Handle general chat messages
 */
router.post('/', async (req: Request, res: Response) => {
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

export default router;
