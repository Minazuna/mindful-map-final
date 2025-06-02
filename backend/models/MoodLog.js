const mongoose = require('mongoose');

const MoodLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  mood: {
    type: String,
    required: true,
  },
  moodScore: {
    type: Number,
    required: true,
  },
  activities: {
    type: [String],
    required: true,
  },
  social: {
    type: [String],
    required: true,
  },
  health: {
    type: [String],
    required: true,
  },
  sleepQuality: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('MoodLog', MoodLogSchema);