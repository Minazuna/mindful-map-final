const mongoose = require('mongoose');

const TeacherRecommendationSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['activity', 'social', 'health', 'sleep'],
    trim: true
  },
  activity: {
    type: String,
    trim: true
  },
  beforeEmotion: {
    type: String,
    trim: true
  },
  afterEmotion: {
    type: String,
    trim: true
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly'],
    trim: true
  },
recommendations: [
  {
    text: { type: String, required: true, trim: true },
    feedback: [
      {
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
        effective: { type: Boolean }
      }
    ]
  }
],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// helpful compound index with the new fields
TeacherRecommendationSchema.index({
  section: 1,
  category: 1,
  activity: 1,
  beforeEmotion: 1,
  afterEmotion: 1,
  period: 1
});

module.exports = mongoose.model('TeacherRecommendation', TeacherRecommendationSchema);