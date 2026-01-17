const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Get all logs
router.get('/', async (req, res) => {
  try {
    const logs = await Log.findMany({
      include: {
        task: {
          select: { title: true, status: true, priority: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// Get a specific log by ID
router.get('/:id', async (req, res) => {
  try {
    const log = await Log.findUnique({
      where: { id: req.params.id },
      include: { task: true }
    });
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching log', error: error.message });
  }
});

// Create a new log
router.post('/', async (req, res) => {
  try {
    const { userInput, aiResponse, metadata } = req.body;

    const log = await Log.create({
      data: {
        userInput,
        aiResponse,
        conversationContext: metadata?.conversationContext || null,
        selectedTaskId: metadata?.selectedTaskId || null,
        isClassified: false,
        isTask: false,
      }
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error creating log', error: error.message });
  }
});

// Update log (used after classification)
router.put('/:id', async (req, res) => {
  try {
    const { isTask, taskId, isClassified } = req.body;

    const log = await Log.update({
      where: { id: req.params.id },
      data: { isTask, taskId, isClassified },
      include: {
        task: {
          select: { title: true, status: true, priority: true }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error updating log', error: error.message });
  }
});

// Delete a log
router.delete('/:id', async (req, res) => {
  try {
    const log = await Log.delete({
      where: { id: req.params.id }
    });
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting log', error: error.message });
  }
});

// Get unclassified logs (for background processing)
router.get('/unclassified/pending', async (req, res) => {
  try {
    const logs = await Log.findMany({
      where: { isClassified: false },
      orderBy: { createdAt: 'asc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unclassified logs', error: error.message });
  }
});

module.exports = router;
