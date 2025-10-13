const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'events', 'deadlines', 'general'],
    required: true
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  author: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);