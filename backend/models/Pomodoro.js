const mongoose = require("mongoose");

const pomodoroSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  completedSessions: { 
    type: Number, 
    default: 0 
  },
  lastSession: { 
    type: Date, 
    default: null 
  },
  streak: { 
    type: Number, 
    default: 0 
  },
  totalSessions: { 
    type: Number, 
    default: 0 
  },
  sessionHistory: [{
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    duration: { type: Number, required: true }, 
    task: { type: String, default: null }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Pomodoro", pomodoroSchema);