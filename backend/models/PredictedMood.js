const mongoose = require('mongoose');

const predictedMoodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  predictions: {
    activity: {
      Monday: { predictedMood: String, probability: Number, actualMood: String },
      Tuesday: { predictedMood: String, probability: Number, actualMood: String },
      Wednesday: { predictedMood: String, probability: Number, actualMood: String },
      Thursday: { predictedMood: String, probability: Number, actualMood: String },
      Friday: { predictedMood: String, probability: Number, actualMood: String },
      Saturday: { predictedMood: String, probability: Number, actualMood: String },
      Sunday: { predictedMood: String, probability: Number, actualMood: String }
    },
    social: {
      Monday: { predictedMood: String, probability: Number, actualMood: String },
      Tuesday: { predictedMood: String, probability: Number, actualMood: String },
      Wednesday: { predictedMood: String, probability: Number, actualMood: String },
      Thursday: { predictedMood: String, probability: Number, actualMood: String },
      Friday: { predictedMood: String, probability: Number, actualMood: String },
      Saturday: { predictedMood: String, probability: Number, actualMood: String },
      Sunday: { predictedMood: String, probability: Number, actualMood: String }
    },
    health: {
      Monday: { predictedMood: String, probability: Number, actualMood: String },
      Tuesday: { predictedMood: String, probability: Number, actualMood: String },
      Wednesday: { predictedMood: String, probability: Number, actualMood: String },
      Thursday: { predictedMood: String, probability: Number, actualMood: String },
      Friday: { predictedMood: String, probability: Number, actualMood: String },
      Saturday: { predictedMood: String, probability: Number, actualMood: String },
      Sunday: { predictedMood: String, probability: Number, actualMood: String }
    },
    sleep: {
      Monday: { predictedMood: String, probability: Number, actualMood: String },
      Tuesday: { predictedMood: String, probability: Number, actualMood: String },
      Wednesday: { predictedMood: String, probability: Number, actualMood: String },
      Thursday: { predictedMood: String, probability: Number, actualMood: String },
      Friday: { predictedMood: String, probability: Number, actualMood: String },
      Saturday: { predictedMood: String, probability: Number, actualMood: String },
      Sunday: { predictedMood: String, probability: Number, actualMood: String }
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per week
predictedMoodSchema.index({ user: 1, year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('PredictedMood', predictedMoodSchema);