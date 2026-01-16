const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userInput: {
    type: String,
    required: true,
  },
  aiResponse: {
    type: String,
    required: true,
  },
  isTask: {
    type: Boolean,
    default: false,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  isClassified: {
    type: Boolean,
    default: false,
  },
  metadata: {
    conversationContext: {
      type: String,
      default: null,
    },
    selectedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Log', logSchema);
