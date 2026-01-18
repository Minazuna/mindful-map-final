const mongoose = require('mongoose');

const STATUS_FLOW = [
  'pending_review',
  'reviewed',
  'monitoring',
  'resolved'
];

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: STATUS_FLOW,
    required: true,
  },
  observation: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { _id: false });

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

  // --- Add weekStart and weekEnd for weekly records ---
  weekStart: {
    type: Date,
    required: true,
    index: true,
  },
  weekEnd: {
    type: Date,
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

  concerningKeywords: [String],

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
  },

  // -----------------------------
  // Teacher Monitoring Section
  // -----------------------------
  monitoringStatus: {
    type: String,
    enum: STATUS_FLOW,
    default: 'pending_review',
  },

  teacherObservation: {
    type: String,
  },

  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  lastStatusUpdate: {
    type: Date,
    default: Date.now,
  },

  // -----------------------------
  // Status/Observation History
  // -----------------------------
  statusHistory: [StatusHistorySchema]

}, {
  timestamps: true
});

// Compound index to ensure one record per student/section/week
StudentSeveritySchema.index(
  { studentId: 1, sectionId: 1, weekStart: 1, weekEnd: 1 },
  { unique: true }
);

module.exports = mongoose.model('StudentSeverity', StudentSeveritySchema);