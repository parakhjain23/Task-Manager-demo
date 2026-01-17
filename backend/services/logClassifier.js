const Log = require('../models/Log');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const { classifyLog, detectTaskIntent } = require('./aiService');

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
    let result = null;
    let isTask = false;
    let taskData = null;
    let aiResponseText = null;

    // Check if we have full conversation history for better context
    let history = null;
    if (log.conversationContext) {
      try {
        const parsed = JSON.parse(log.conversationContext);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      } catch (e) {
        // Not JSON, treat as simple context string
      }
    }

    if (history) {
      // Use the more advanced conversational intent detector
      const analysis = await detectTaskIntent(history, teamMembers);
      isTask = analysis.shouldCreateTask;
      taskData = analysis.taskData;
      aiResponseText = analysis.response;
    } else {
      // Fallback to simple classification
      const classification = await classifyLog(
        { userInput: log.userInput, aiResponse: log.aiResponse },
        teamMembers
      );
      isTask = classification.isTask && classification.confidence >= 0.7;
      taskData = classification.taskData;
      aiResponseText = classification.reasoning;
    }

    console.log(`[LogClassifier] Log ${log.id} classified as task: ${isTask}`);

    let createdTaskId = null;

    // If it's a task, create it
    if (isTask && taskData) {
      // Set defaults for optional fields
      const finalTaskData = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        assignedTo: taskData.assignedTo || null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        status: 'pending'
      };

      // Create the task
      const task = await Task.create({
        data: finalTaskData
      });

      createdTaskId = task.id;
      console.log(`[LogClassifier] Created task ${task.id} from log ${log.id}: "${task.title}"`);

      // Update assigned team member's workload
      if (finalTaskData.assignedTo) {
        await TeamMember.update({
          where: { name: finalTaskData.assignedTo },
          data: { currentWorkload: { increment: 1 } }
        });
      }
    }

    // Update log with results
    await Log.update({
      where: { id: log.id },
      data: {
        isClassified: true,
        isTask: isTask,
        taskId: createdTaskId,
        aiResponse: aiResponseText || log.aiResponse
      }
    });
  }
}

// Create singleton instance
const classifier = new LogClassifier();

module.exports = classifier;
