const mongoose = require('mongoose');

const StudentSeveritySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sectionId: {
    type: String,
    ref: 'Section',
    required: true,
    index: true,
  },
  severityLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true,
  },
  riskScore: {
    type: Number,
    required: true,
  },
  negativeMoodCount: {
    type: Number,
    default: 0,
  },
  concerningKeywords: [
    {
      type: String,
    }
  ],
  recentMoodLogs: [
    {
      moodLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'MoodLog' },
      moodScore: Number,
      reason: String,
      date: Date,
    }
  ],
  moodScoreDrop: {
    type: Number,
    default: 0,
  },
  isOutlier: {
    type: Boolean,
    default: false,
  },
  lastEvaluated: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('StudentSeverity', StudentSeveritySchema);