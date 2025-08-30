const MoodLog = require('../models/MoodLog');
const moment = require('moment');

exports.saveMood = async (req, res) => {
  try {
    const { 
      category, 
      activity, 
      hrs, 
      beforeValence, 
      beforeEmotion, 
      beforeIntensity,
      beforeReason, 
      afterValence, 
      afterEmotion, 
      afterIntensity,
      afterReason,
      selectedDate, // Add selectedDate to destructuring
      selectedTime  // Add selectedTime to destructuring
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
    }

    // Validate required fields
    if (!category || !['activity', 'social', 'health', 'sleep'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Valid category is required (activity, social, health, sleep).' });
    }

    if (!beforeValence || !afterValence) {
      return res.status(400).json({ success: false, message: 'Before and after valence are required.' });
    }

    if (!afterEmotion || !afterIntensity || !afterReason) {
      return res.status(400).json({ success: false, message: 'After emotion, intensity, and reason are required.' });
    }

    // Validate category-specific fields
    if (category === 'sleep') {
      if (!hrs || typeof hrs !== 'number') {
        return res.status(400).json({ success: false, message: 'Hours of sleep is required for sleep category.' });
      }
    } else {
      if (!activity) {
        return res.status(400).json({ success: false, message: 'Activity is required for this category.' });
      }
    }

    // Validate before emotion and intensity if not "can't remember"
    if (beforeValence !== 'can\'t remember') {
      if (!beforeEmotion || !beforeIntensity || !beforeReason) {
        return res.status(400).json({ success: false, message: 'Before emotion, intensity, and reason are required when valence is specified.' });
      }
    }

    const now = new Date();
    
    // Use selectedTime if provided, otherwise selectedDate with current time, otherwise current date/time
    let logDate = now;
    if (selectedTime) {
      // selectedTime is already in UTC from frontend conversion
      logDate = new Date(selectedTime);
    } else if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      // Preserve the current time but use the selected date
      logDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 
                        now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }

    // For sleep category, check if there's already an entry today and update it
    if (category === 'sleep') {
      const startOfDay = new Date(logDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(logDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const existingSleepLog = await MoodLog.findOne({
        user: req.user._id,
        category: 'sleep',
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingSleepLog) {
        // Update existing sleep log
        existingSleepLog.hrs = hrs;
        existingSleepLog.beforeValence = beforeValence;
        existingSleepLog.beforeEmotion = beforeValence !== 'can\'t remember' ? beforeEmotion : null;
        existingSleepLog.beforeIntensity = beforeValence !== 'can\'t remember' ? beforeIntensity : 0;
        existingSleepLog.afterValence = afterValence;
        existingSleepLog.afterEmotion = afterEmotion;
        existingSleepLog.afterIntensity = afterIntensity;
        existingSleepLog.date = logDate;

        await existingSleepLog.save();

        return res.status(200).json({ 
          success: true, 
          message: 'Sleep log updated successfully.',
          log: existingSleepLog
        });
      }
    }

    // Create new mood log entry
    const newMoodLog = new MoodLog({
      user: req.user._id,
      date: logDate,
      category,
      activity: category !== 'sleep' ? activity : undefined,
      hrs: category === 'sleep' ? hrs : undefined,
      beforeValence,
      beforeEmotion: beforeValence !== 'can\'t remember' ? beforeEmotion : null,
      beforeIntensity: beforeValence !== 'can\'t remember' ? beforeIntensity : 0,
      beforeReason: beforeValence !== 'can\'t remember' ? beforeReason : null,
      afterValence,
      afterEmotion,
      afterIntensity,
      afterReason
    });

    await newMoodLog.save();

    res.status(200).json({ 
      success: true, 
      message: 'Mood log saved successfully.',
      log: newMoodLog
    });
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

exports.getTodaysLastMoodLog = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
    }

    const { category } = req.query;

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Build query
    const query = {
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    // If category is specified, filter by category
    if (category) {
      query.category = category;
    }

    // Find all mood logs for today (optionally filtered by category)
    const todaysMoodLogs = await MoodLog.find(query).sort({ date: -1 });

    if (!todaysMoodLogs.length) {
      return res.status(200).json({ 
        success: false, 
        message: category 
          ? `No previous mood logs found for ${category} category today` 
          : 'No previous mood logs found for today',
        lastLog: null 
      });
    }

    // Return the most recent log from today
    const lastMoodLog = todaysMoodLogs[0];

    res.status(200).json({ 
      success: true, 
      lastLog: lastMoodLog 
    });
  } catch (error) {
    console.error('Error fetching today\'s last mood log:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching today\'s last mood log.' });
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
    const { month, year, page = 0, limit = 4, category } = req.query;
    const skip = page * limit;

    // Build query
    const query = {
      user: req.user._id,
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      }
    };

    // Add category filter if specified
    if (category) {
      query.category = category;
    }

    const moodLogs = await MoodLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json(moodLogs);
  } catch (error) {
    console.error('Error fetching paginated mood logs:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching paginated mood logs.' });
  }
};

// Get mood logs by category
exports.getMoodLogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!['activity', 'social', 'health', 'sleep'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const moodLogs = await MoodLog.find({ 
      user: req.user._id, 
      category 
    }).sort({ date: -1 });

    res.status(200).json(moodLogs);
  } catch (error) {
    console.error('Error fetching mood logs by category:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching mood logs by category.' });
  }
};

// Get today's sleep log specifically
exports.getTodaysSleepLog = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const sleepLog = await MoodLog.findOne({
      user: req.user._id,
      category: 'sleep',
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!sleepLog) {
      return res.status(200).json({ 
        success: false, 
        message: 'No sleep log found for today',
        sleepLog: null 
      });
    }

    res.status(200).json({ 
      success: true, 
      sleepLog 
    });
  } catch (error) {
    console.error('Error fetching today\'s sleep log:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching today\'s sleep log.' });
  }
};