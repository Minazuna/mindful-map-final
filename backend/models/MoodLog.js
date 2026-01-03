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
  category: {
    type: String,
    required: true,
    enum: ['activity', 'social', 'health', 'sleep']
  },
  // For activity, social, and health categories
  activity: {
    type: String,
    required: function() {
      return this.category !== 'sleep';
    }
  },
  // For sleep category
  hrs: {
    type: Number,
    required: function() {
      return this.category === 'sleep';
    }
  },
  // Before valence tracking
  beforeValence: {
    type: String,
    enum: ['positive', 'negative', 'can\'t remember'],
    required: true
  },
  beforeEmotion: {
    type: String,
    default: null,
    required: function() {
      return this.beforeValence !== 'can\'t remember';
    }
  },
  beforeIntensity: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    required: function() {
      return this.beforeValence !== 'can\'t remember';
    }
  },
  beforeReason: {
    type: String,
    default: null,
    maxlength: 500
  },
  // After valence tracking
  afterValence: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  afterEmotion: {
    type: String,
    required: true
  },
  afterIntensity: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  afterReason: {
    type: String,
    default: '',
    maxlength: 500
  },
  teacherObservation: {
    type: String,
    default: null,
    maxlength: 1000
  },
  observationMatch: {
    type: Boolean,
    default: null
  },
  observationUpdatedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('MoodLog', MoodLogSchema);