const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  currentWorkload: {
    type: Number,
    default: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  }
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);
