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

    if (!afterEmotion || !afterIntensity) {
      return res.status(400).json({ success: false, message: 'After emotion and intensity are required.' });
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

    // Validate before emotion and intensity if not "can't remember" (reason is optional)
    if (beforeValence !== 'can\'t remember') {
      if (!beforeEmotion || !beforeIntensity) {
        return res.status(400).json({ success: false, message: 'Before emotion and intensity are required when valence is specified.' });
      }
    }

    const now = new Date();
    
    // Use selectedTime if provided, otherwise selectedDate with current time, otherwise current date/time
    let logDate = now;
    if (selectedTime && category !== 'sleep') {
      // selectedTime is only used for non-sleep categories
      logDate = new Date(selectedTime);
    } else if (selectedDate) {
      // Parse selectedDate safely to avoid timezone issues
      const dateParts = selectedDate.split('-');
      const selectedDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      
      if (category === 'sleep') {
        // For sleep, use a fixed time (noon) to avoid time-specific storage
        logDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 12, 0, 0, 0);
      } else {
        // For other categories, preserve the current time but use the selected date
        logDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 
                          now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      }
    } else if (category === 'sleep') {
      // If no date selected for sleep, use today at noon
      logDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    }

    // For sleep category, check if there's already an entry today and prevent duplicate
    if (category === 'sleep') {
      const startOfDay = new Date(logDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(logDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingSleepLog = await MoodLog.findOne({
        user: req.user._id,
        category: 'sleep',
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingSleepLog) {
        // Prevent duplicate sleep entries
        return res.status(400).json({ 
          success: false, 
          message: 'You already have a sleep log for this date. Only one sleep entry per day is allowed.',
          existingLog: existingSleepLog
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

exports.getRecentMoodLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const moodLogs = await MoodLog.find({ user: req.user._id }).sort({ date: -1 }).limit(limit);
    
    if (!moodLogs.length) {
      return res.status(200).json({ success: true, logs: [] });
    }
    
    res.status(200).json({ success: true, logs: moodLogs });
  } catch (error) {
    console.error('Error fetching recent mood logs:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching recent mood logs.' });
  }
};

exports.getTodaysLastMoodLog = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user found in request.' });
    }

    const { category, date } = req.query;

    // Get date range - use provided date or today
    let targetDate = new Date();
    if (date) {
      // Parse date more carefully to avoid timezone issues
      const dateParts = date.split('-');
      targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    
    console.log('getTodaysLastMoodLog - Requested date:', date);
    console.log('getTodaysLastMoodLog - Target date:', targetDate);
    console.log('getTodaysLastMoodLog - Category:', category);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('getTodaysLastMoodLog - Date range:', startOfDay, 'to', endOfDay);

    // Build query
    const query = {
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    // If category is specified, filter by category
    if (category) {
      query.category = category;
    }

    console.log('getTodaysLastMoodLog - Query:', JSON.stringify(query, null, 2));

    // Find all mood logs for the specified date (optionally filtered by category)
    const todaysMoodLogs = await MoodLog.find(query).sort({ date: -1 });
    
    console.log('getTodaysLastMoodLog - Found logs:', todaysMoodLogs.length);
    todaysMoodLogs.forEach((log, index) => {
      console.log(`Log ${index}:`, {
        id: log._id,
        category: log.category,
        hrs: log.hrs,
        date: log.date,
        dateString: log.date.toISOString()
      });
    });

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



