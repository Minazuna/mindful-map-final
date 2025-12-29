const BreathingExercise = require('../models/BreathingExercise');
const Pomodoro = require('../models/Pomodoro'); 

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    let progress = await BreathingExercise.findOne({ user: userId });
    if (!progress) {
      progress = await BreathingExercise.create({ user: userId });
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching progress', error: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const update = req.body; 
    let progress = await BreathingExercise.findOneAndUpdate(
      { user: userId },
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating progress', error: err.message });
  }
};

// Pomodoro feature functions
exports.getPomodoroProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    let progress = await Pomodoro.findOne({ user: userId });
    if (!progress) {
      progress = await Pomodoro.create({ user: userId });
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching Pomodoro progress', error: err.message });
  }
};

exports.updatePomodoroProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const update = req.body;
    let progress = await Pomodoro.findOneAndUpdate(
      { user: userId },
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating Pomodoro progress', error: err.message });
  }
};