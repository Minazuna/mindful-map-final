const mongoose = require('mongoose');

const personalJournalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  scores: {
    textblob: {
      polarity: Number,
      subjectivity: Number
    },
    vader: {
      compound: Number,
      pos: Number,
      neu: Number,
      neg: Number
    },
    combined: Number
  },
  suggestions: [String],
  insights: [String],
  wordCount: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PersonalJournal', personalJournalSchema);