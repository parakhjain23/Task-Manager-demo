const Log = require('../models/Log');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const { classifyLog } = require('./aiService');

/**
 * Background service that periodically processes unclassified logs
 * and creates tasks if the AI determines they should be tasks
 */
class LogClassifier {
  constructor() {
    this.isProcessing = false;
    this.intervalMs = 5000; // Check every 5 seconds
    this.intervalId = null;
  }

  /**
   * Start the background classifier
   */
  start() {
    console.log('[LogClassifier] Starting background log classification service...');
    this.intervalId = setInterval(() => {
      this.processUnclassifiedLogs();
    }, this.intervalMs);
  }

  /**
   * Stop the background classifier
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[LogClassifier] Background log classification service stopped.');
    }
  }

  /**
   * Process all unclassified logs
   */
  async processUnclassifiedLogs() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;

      // Get all unclassified logs
      const unclassifiedLogs = await Log.findMany({
        where: { isClassified: false },
        orderBy: { createdAt: 'asc' }
      });

      if (unclassifiedLogs.length === 0) {
        return; // Nothing to process
      }

      console.log(`[LogClassifier] Processing ${unclassifiedLogs.length} unclassified log(s)...`);

      // Get team members for task assignment
      const teamMembers = await TeamMember.findMany();

      // Process each log
      for (const log of unclassifiedLogs) {
        try {
          await this.classifyAndCreateTask(log, teamMembers);
        } catch (error) {
          console.error(`[LogClassifier] Error processing log ${log.id}:`, error.message);
          // Mark as classified anyway to avoid retrying failed logs infinitely
          await Log.update({
            where: { id: log.id },
            data: { isClassified: true }
          });
        }
      }

      console.log(`[LogClassifier] Finished processing ${unclassifiedLogs.length} log(s).`);
    } catch (error) {
      console.error('[LogClassifier] Error in processUnclassifiedLogs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Classify a single log and create a task if needed
   */
  async classifyAndCreateTask(log, teamMembers) {
    // Call AI classification service
    const classification = await classifyLog(
      { userInput: log.userInput, aiResponse: log.aiResponse },
      teamMembers
    );

    console.log(`[LogClassifier] Log ${log.id} classification:`, {
      isTask: classification.isTask,
      confidence: classification.confidence,
      reasoning: classification.reasoning
    });

    // If it's a task with high confidence, create it
    if (classification.isTask && classification.taskData && classification.confidence >= 0.7) {
      // Set defaults for optional fields
      const taskData = {
        title: classification.taskData.title,
        description: classification.taskData.description,
        priority: classification.taskData.priority || 'medium',
        tags: classification.taskData.tags || [],
        assignedTo: classification.taskData.assignedTo || null,
        dueDate: classification.taskData.dueDate ? new Date(classification.taskData.dueDate) : null,
        status: 'pending'
      };

      // Create the task
      const task = await Task.create({
        data: taskData
      });

      console.log(`[LogClassifier] Created task ${task.id} from log ${log.id}: "${task.title}"`);

      // Update assigned team member's workload
      if (taskData.assignedTo) {
        await TeamMember.update({
          where: { name: taskData.assignedTo },
          data: { currentWorkload: { increment: 1 } }
        });
      }

      // Update log with task reference
      await Log.update({
        where: { id: log.id },
        data: {
          isTask: true,
          taskId: task.id,
          isClassified: true
        }
      });
    } else {
      // Mark log as classified
      await Log.update({
        where: { id: log.id },
        data: { isClassified: true }
      });
    }
  }
}

// Create singleton instance
const classifier = new LogClassifier();

module.exports = classifier;
