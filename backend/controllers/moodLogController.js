const MoodLog = require('../models/MoodLog');
const moment = require('moment');

exports.saveMood = async (req, res) => {
  try {
    const { mood, activities, social, health, sleepHours } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
    }

    const moodValues = {
      'Happy': 4,
      'Fine': 2,
      'Anxious': 0,
      'Sad': -3,
      'Angry': -1
    };

    const moodValue = moodValues[mood] !== undefined ? moodValues[mood] : 0;

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Find the most recent mood log for today
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const recentLog = await MoodLog.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 }); 

    if (recentLog && new Date(recentLog.date) > thirtyMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'You can only log a new mood after 30 minutes.',
      });
    }

    const newMoodLog = new MoodLog({
      user: req.user._id,
      mood,
      moodScore: moodValue,
      activities,
      social,
      health,
      sleepQuality: sleepHours,
      date: now, 
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    await newMoodLog.save();

    if (['angry', 'sad', 'anxious'].includes(mood.toLowerCase())) {
      return res.status(200).json({ success: true, message: 'Mood log saved successfully.', mood });
    }

    res.status(200).json({ success: true, message: 'Mood log saved successfully.' });
  } catch (error) {
    console.error('Error saving mood log:', error);
    res.status(500).json({ success: false, message: 'Server error while saving mood log.' });
  }
};

exports.getAllMoodLogs = async (req, res) => {
  try {
    const moodLogs = await MoodLog.find({ user: req.user._id }).sort({ date: -1 });
    if (!moodLogs.length) {
      return res.status(404).json({ success: false, message: 'No mood logs found' });
    }
    res.status(200).json(moodLogs);
  } catch (error) {
    console.error('Error fetching mood logs:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching mood logs.' });
  }
};


exports.checkMoodLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfCurrentWeek = moment().startOf('isoWeek');

    // Get the last two full weeks before the current week
    const startOfLastWeek = moment(startOfCurrentWeek).subtract(1, 'weeks'); // Last week's Monday
    const endOfLastWeek = moment(startOfCurrentWeek).subtract(1, 'days'); // Last week's Sunday
    const startOfTwoWeeksAgo = moment(startOfCurrentWeek).subtract(2, 'weeks'); // Two weeks ago Monday
    const endOfTwoWeeksAgo = moment(startOfLastWeek).subtract(1, 'days'); // Two weeks ago Sunday

    const logsLastWeek = await MoodLog.find({
      user: userId,
      date: { $gte: startOfLastWeek.toDate(), $lte: endOfLastWeek.toDate() }
    });

    const logsTwoWeeksAgo = await MoodLog.find({
      user: userId,
      date: { $gte: startOfTwoWeeksAgo.toDate(), $lte: endOfTwoWeeksAgo.toDate() }
    });

    // Count unique days logged in each week
    const uniqueDaysLastWeek = new Set(logsLastWeek.map(log => moment(log.date).format('YYYY-MM-DD')));
    const uniqueDaysTwoWeeksAgo = new Set(logsTwoWeeksAgo.map(log => moment(log.date).format('YYYY-MM-DD')));

    const hasLogsLastWeek = uniqueDaysLastWeek.size > 0;
    const hasLogsTwoWeeksAgo = uniqueDaysTwoWeeksAgo.size > 0;

    // Check if user skipped 2 full consecutive weeks
    const skippedTwoWeeks = !hasLogsLastWeek && !hasLogsTwoWeeksAgo;

    res.json({
      success: true,
      allowAccess: !skippedTwoWeeks, 
      skippedTwoWeeks,
      logsLastWeek: uniqueDaysLastWeek.size,
      logsTwoWeeksAgo: uniqueDaysTwoWeeksAgo.size,
    });

  } catch (error) {
    console.error('Error checking mood logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking mood logs',
      error: error.message
    });
  }
};

exports.getPaginatedMoodLogs = async (req, res) => {
  try {
    const { month, year, page = 0, limit = 4 } = req.query;
    const skip = page * limit;

    const moodLogs = await MoodLog.find({
      user: req.user._id,
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      }
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json(moodLogs);
  } catch (error) {
    console.error('Error fetching paginated mood logs:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching paginated mood logs.' });
  }
};