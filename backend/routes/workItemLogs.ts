import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stringifyBigInt } from '../utils/bigint';

const router = express.Router();

// Create a new log entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { workItemId, logType, message, oldValue, newValue } = req.body;

    if (!workItemId || !logType || !message) {
      return res.status(400).json({
        error: 'Missing required fields: workItemId, logType, and message are required'
      });
    }

    const log = await prisma.workItemLog.create({
      data: {
        workItemId: BigInt(workItemId.toString()),
        logType,
        message,
        oldValue,
        newValue,
      },
    });

    res.status(201).json(stringifyBigInt(log));
  } catch (error) {
    console.error('Error creating log entry:', error);
    res.status(500).json({ error: 'Failed to create log entry' });
  }
});

// Get all logs for a work item
router.get('/work-item/:workItemId', async (req: Request, res: Response) => {
  try {
    const { workItemId } = req.params;

    const logs = await prisma.workItemLog.findMany({
      where: {
        workItemId: BigInt(workItemId as string),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(stringifyBigInt(logs));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
