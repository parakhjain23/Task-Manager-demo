const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  query: {
    type: String,
    required: true
  },
  filters: {
    status: { type: String, default: null },
    priority: { type: String, default: null },
    createdWithinDays: { type: Number, default: null },
    dueWithinDays: { type: Number, default: null },
    assignedTo: { type: String, default: null },
    tags: [{ type: String }],
    createdToday: { type: Boolean, default: false },
    createdThisWeek: { type: Boolean, default: false },
    dueThisWeek: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('View', viewSchema);
