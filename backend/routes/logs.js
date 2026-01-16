const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Get all logs
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('taskId', 'title status priority')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});

// Get a specific log by ID
router.get('/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id)
      .populate('taskId');
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

    const log = new Log({
      userInput,
      aiResponse,
      metadata: metadata || {},
      isClassified: false,
      isTask: false,
    });

    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error creating log', error: error.message });
  }
});

// Update log (used after classification)
router.put('/:id', async (req, res) => {
  try {
    const { isTask, taskId, isClassified } = req.body;

    const log = await Log.findByIdAndUpdate(
      req.params.id,
      { isTask, taskId, isClassified },
      { new: true }
    ).populate('taskId', 'title status priority');

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
    const log = await Log.findByIdAndDelete(req.params.id);
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
    const logs = await Log.find({ isClassified: false })
      .sort({ createdAt: 1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unclassified logs', error: error.message });
  }
});

module.exports = router;
