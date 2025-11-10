const MoodLog = require('../models/MoodLog');
const MoodScore = require('../models/MoodScore');

exports.getDailyStatistics = async (req, res) => {
  try {
    console.log('🔍 === getDailyStatistics Debug ===');
    console.log('🔍 User ID:', req.user?._id);
    console.log('🔍 Query date:', req.query.date);

    const userId = req.user._id;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    console.log('🔍 Target date:', targetDate);

    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log('🔍 Date range (UTC):', { startOfDay, endOfDay });
    console.log('🔍 Searching for userId:', userId);

    const allUserMoodLogs = await MoodLog.find({ user: userId }).sort({ date: -1 }).limit(5);
    console.log('🔍 Recent mood logs for user:', allUserMoodLogs.map(log => ({
      id: log._id,
      date: log.date,
      dateString: log.date.toISOString(),
      afterEmotion: log.afterEmotion,
      beforeEmotion: log.beforeEmotion,
    })));

    const moodLogs = await MoodLog.find({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ date: 1 });

    console.log('🔍 Mood logs found for date range:', moodLogs.length);

    if (moodLogs.length > 0) {
      console.log('🔍 Found mood logs:', moodLogs.map(log => ({
        id: log._id,
        date: log.date,
        beforeEmotion: log.beforeEmotion,
        afterEmotion: log.afterEmotion,
        beforeValence: log.beforeValence,
        afterValence: log.afterValence
      })));
    }

    if (moodLogs.length === 0) {
      console.log('🔍 No mood logs found - returning empty data');
      return res.json({
        success: true,
        data: {
          totalLogs: 0,
          mostProminentValence: null,
          emotionCounts: {},
          valenceCounts: { positive: 0, negative: 0 },
          timeSegmentMoods: {
            earlyMorning: null,
            morning: null,
            afternoon: null,
            evening: null
          },
          date: targetDate.toISOString().split('T')[0]
        }
      });
    }

    // Combine before and after emotions for a holistic daily summary
    const allEmotions = [
      ...moodLogs.map(log => ({
        emotion: log.beforeEmotion,
        valence: log.beforeValence,
        intensity: log.beforeIntensity,
        time: new Date(log.date)
      })),
      ...moodLogs.map(log => ({
        emotion: log.afterEmotion,
        valence: log.afterValence,
        intensity: log.afterIntensity,
        time: new Date(log.date)
      }))
    ];

    console.log('🔍 All emotions extracted:', allEmotions);

    // Calculate most prominent valence
    const valenceCounts = { positive: 0, negative: 0 };
    allEmotions.forEach(emotion => {
      if (emotion.valence === 'positive') valenceCounts.positive++;
      if (emotion.valence === 'negative') valenceCounts.negative++;
    });

    const mostProminentValence =
      valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Count emotion occurrences
    const emotionCounts = {};
    allEmotions.forEach(emotion => {
      if (!emotion.emotion) return;
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    // Categorize by time segments and find most prominent mood for each
    const timeSegments = {
      earlyMorning: [], // 12:00 AM – 5:59 AM
      morning: [],      // 6:00 AM – 11:59 AM
      afternoon: [],    // 12:00 PM – 5:59 PM
      evening: []       // 6:00 PM – 11:59 PM
    };

    allEmotions.forEach(emotion => {
      const hour = emotion.time.getHours();
      if (hour >= 0 && hour < 6) {
        timeSegments.earlyMorning.push(emotion);
      } else if (hour >= 6 && hour < 12) {
        timeSegments.morning.push(emotion);
      } else if (hour >= 12 && hour < 18) {
        timeSegments.afternoon.push(emotion);
      } else {
        timeSegments.evening.push(emotion);
      }
    });

    // Find most prominent mood for each time segment
    const timeSegmentMoods = {};
    Object.keys(timeSegments).forEach(segment => {
      const emotions = timeSegments[segment];
      if (emotions.length === 0) {
        timeSegmentMoods[segment] = null;
      } else {
        // Count emotions in this time segment
        const segmentEmotionCounts = {};
        emotions.forEach(emotion => {
          if (!emotion.emotion) return;
          segmentEmotionCounts[emotion.emotion] = (segmentEmotionCounts[emotion.emotion] || 0) + 1;
        });

        // Find most frequent emotion
        const mostFrequentEmotion = Object.keys(segmentEmotionCounts).reduce((a, b) =>
          segmentEmotionCounts[a] > segmentEmotionCounts[b] ? a : b
        );

        // Calculate average intensity for this emotion in this segment
        const emotionInstances = emotions.filter(e => e.emotion === mostFrequentEmotion);
        const avgIntensity =
          emotionInstances.reduce((sum, e) => sum + e.intensity, 0) / emotionInstances.length;

        timeSegmentMoods[segment] = {
          emotion: mostFrequentEmotion,
          count: segmentEmotionCounts[mostFrequentEmotion],
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          totalEntries: emotions.length
        };
      }
    });

    const avgIntensity =
      allEmotions.length > 0
        ? allEmotions.reduce((sum, e) => sum + e.intensity, 0) / allEmotions.length
        : 0;

    const responseData = {
      totalLogs: moodLogs.length,
      mostProminentValence: mostProminentValence,
      valenceCounts: valenceCounts,
      emotionCounts: emotionCounts,
      timeSegmentMoods: timeSegmentMoods,
      date: targetDate.toISOString().split('T')[0],
      averageIntensity: Math.round(avgIntensity * 10) / 10
    };

    console.log('🔍 Final response data:', responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in getDailyStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily statistics',
      error: error.message
    });
  }
};


exports.getWeeklyStatistics = async (req, res) => {
  try {
    console.log('🔍 === getWeeklyStatistics Debug ===');
    console.log('🔍 User ID:', req.user?._id);
    console.log('🔍 Query startDate:', req.query.startDate);

    const userId = req.user._id;
    const { startDate } = req.query;

    // If no startDate provided, use current week start (Monday)
    let weekStart;
    if (startDate) {
      weekStart = new Date(startDate);
    } else {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
      weekStart = new Date(now.setDate(diff));
    }

    // Set to start of the week (Monday 00:00:00)
    weekStart.setUTCHours(0, 0, 0, 0);

    // Calculate end of week (Sunday 23:59:59)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    console.log('🔍 Week range (UTC):', { weekStart, weekEnd });
    console.log('🔍 Searching for userId:', userId);

    // Fetch mood logs for the week
    const moodLogs = await MoodLog.find({
      user: userId,
      date: {
        $gte: weekStart,
        $lte: weekEnd
      }
    }).sort({ date: 1 });

    console.log('🔍 Mood logs found for week:', moodLogs.length);

    if (moodLogs.length === 0) {
      console.log('🔍 No mood logs found - returning empty data');
      return res.json({
        success: true,
        data: {
          totalLogs: 0,
          mostProminentValence: null,
          emotionCounts: {},
          valenceCounts: { positive: 0, negative: 0 },
          averageIntensity: 0,
          dailyBreakdown: {},
          timeSegmentMoods: {
            earlyMorning: null,
            morning: null,
            afternoon: null,
            evening: null
          },
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0]
        }
      });
    }

    // Combine before and after emotions for a holistic weekly summary
    const allEmotions = [
      ...moodLogs.map(log => ({
        emotion: log.beforeEmotion,
        valence: log.beforeValence,
        intensity: log.beforeIntensity,
        time: new Date(log.date)
      })),
      ...moodLogs.map(log => ({
        emotion: log.afterEmotion,
        valence: log.afterValence,
        intensity: log.afterIntensity,
        time: new Date(log.date)
      }))
    ];

    console.log('🔍 All emotions extracted:', allEmotions.length);

    // Calculate most prominent valence
    const valenceCounts = { positive: 0, negative: 0 };
    allEmotions.forEach(emotion => {
      if (emotion.valence === 'positive') valenceCounts.positive++;
      if (emotion.valence === 'negative') valenceCounts.negative++;
    });

    const mostProminentValence = valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Count emotion occurrences
    const emotionCounts = {};
    allEmotions.forEach(emotion => {
      if (!emotion.emotion) return;
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    // Categorize by time segments and find most prominent mood for each (WEEKLY)
    const timeSegments = {
      earlyMorning: [], // 12:00 AM – 5:59 AM
      morning: [],      // 6:00 AM – 11:59 AM
      afternoon: [],    // 12:00 PM – 5:59 PM
      evening: []       // 6:00 PM – 11:59 PM
    };

    allEmotions.forEach(emotion => {
      const hour = emotion.time.getHours();
      if (hour >= 0 && hour < 6) {
        timeSegments.earlyMorning.push(emotion);
      } else if (hour >= 6 && hour < 12) {
        timeSegments.morning.push(emotion);
      } else if (hour >= 12 && hour < 18) {
        timeSegments.afternoon.push(emotion);
      } else {
        timeSegments.evening.push(emotion);
      }
    });

    // Find most prominent mood for each time segment
    const timeSegmentMoods = {};
    Object.keys(timeSegments).forEach(segment => {
      const emotions = timeSegments[segment];
      if (emotions.length === 0) {
        timeSegmentMoods[segment] = null;
      } else {
        // Count emotions in this time segment
        const segmentEmotionCounts = {};
        emotions.forEach(emotion => {
          if (!emotion.emotion) return;
          segmentEmotionCounts[emotion.emotion] = (segmentEmotionCounts[emotion.emotion] || 0) + 1;
        });

        // Find most frequent emotion
        const mostFrequentEmotion = Object.keys(segmentEmotionCounts).reduce((a, b) =>
          segmentEmotionCounts[a] > segmentEmotionCounts[b] ? a : b
        );

        // Calculate average intensity for this emotion in this segment
        const emotionInstances = emotions.filter(e => e.emotion === mostFrequentEmotion);
        const avgIntensity =
          emotionInstances.reduce((sum, e) => sum + e.intensity, 0) / emotionInstances.length;

        timeSegmentMoods[segment] = {
          emotion: mostFrequentEmotion,
          count: segmentEmotionCounts[mostFrequentEmotion],
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          totalEntries: emotions.length
        };
      }
    });

    // Calculate average intensity
    const avgIntensity = allEmotions.length > 0
      ? allEmotions.reduce((sum, e) => sum + e.intensity, 0) / allEmotions.length
      : 0;

    // Create daily breakdown (Monday to Sunday)
    const dailyBreakdown = {};
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    daysOfWeek.forEach(day => {
      dailyBreakdown[day] = {
        count: 0,
        emotions: {},
        dominantEmotion: null
      };
    });

    // Group emotions by day of week
    allEmotions.forEach(emotion => {
      const dayOfWeek = emotion.time.toLocaleDateString('en-US', { weekday: 'long' });
      if (dailyBreakdown[dayOfWeek]) {
        dailyBreakdown[dayOfWeek].count++;
        if (!dailyBreakdown[dayOfWeek].emotions[emotion.emotion]) {
          dailyBreakdown[dayOfWeek].emotions[emotion.emotion] = 0;
        }
        dailyBreakdown[dayOfWeek].emotions[emotion.emotion]++;
      }
    });

    // Find dominant emotion for each day
    Object.keys(dailyBreakdown).forEach(day => {
      const dayData = dailyBreakdown[day];
      if (dayData.count > 0 && Object.keys(dayData.emotions).length > 0) {
        dayData.dominantEmotion = Object.keys(dayData.emotions).reduce((a, b) =>
          dayData.emotions[a] > dayData.emotions[b] ? a : b
        );
      }
      delete dayData.emotions;
    });

    const responseData = {
      totalLogs: moodLogs.length,
      totalEntries: allEmotions.length,
      mostProminentValence: mostProminentValence,
      valenceCounts: valenceCounts,
      emotionCounts: emotionCounts,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
      dailyBreakdown: dailyBreakdown,
      timeSegmentMoods: timeSegmentMoods,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    };

    console.log('🔍 Final response data:', responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in getWeeklyStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly statistics',
      error: error.message
    });
  }
};

exports.calculateDailyAnova = async (req, res) => {
  try {
    const userId = req.user._id;
    // Allow date query for navigation
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Fetch mood logs for the target date
    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) }
    });

    // Aggregate by category & activity
    const aggregate = {};
    let sleepQuality = null;
    let sleepHours = null;
    let sleepMoodScore = null;

    logs.forEach(log => {
      if (log.category === 'sleep') {
        sleepHours = log.hrs;
        if (sleepHours <= 4) sleepQuality = 'Poor';
        else if (sleepHours >= 6 && sleepHours <= 8) sleepQuality = 'Sufficient';
        else if (sleepHours > 8) sleepQuality = 'Good';

        // Calculate sleep mood score based on hours
        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepMoodScore = Math.round(((sleepHours - 4) / 5) * 80);
        } else if (sleepHours < 7) {
          sleepMoodScore = Math.round(((sleepHours - 7) / 7) * 100);
        } else if (sleepHours > 9) {
          sleepMoodScore = Math.round(((9 - sleepHours) / 2) * 30);
        }
      } else {
        // Only include logs with both before and after intensity
        if (
          log.beforeIntensity !== undefined && log.beforeIntensity !== null &&
          log.afterIntensity !== undefined && log.afterIntensity !== null
        ) {
          const key = `${log.category}_${log.activity}`;
          if (!aggregate[key]) {
            aggregate[key] = {
              category: log.category,
              activity: log.activity,
              totalBefore: 0,
              totalAfter: 0,
              count: 0
            };
          }
          aggregate[key].totalBefore += log.beforeIntensity;
          aggregate[key].totalAfter += log.afterIntensity;
          aggregate[key].count += 1;
        }
      }
    });

    // Calculate moodScore and save/update MoodScore
    const scores = [];
    for (const key in aggregate) {
      const { category, activity, totalBefore, totalAfter, count } = aggregate[key];
      const diff = totalAfter - totalBefore;
      const maxScore = count * 5;
      const moodScore = Math.round(((diff / maxScore) * 100)); // percentage

      // Save to MoodScore collection
      await MoodScore.findOneAndUpdate(
        { user: userId, date: targetDate, category, activity },
        { moodScore },
        { upsert: true, new: true }
      );

      scores.push({ category, activity, moodScore });
    }

    // Separate top positive and negative per category
    const results = {};
    scores.forEach(score => {
      if (!results[score.category]) results[score.category] = { positive: [], negative: [] };
      if (score.moodScore > 0) results[score.category].positive.push(score);
      else if (score.moodScore < 0) results[score.category].negative.push(score);
    });

    // Sort and slice top 3 for each
    Object.keys(results).forEach(cat => {
      results[cat].positive = results[cat].positive
        .sort((a, b) => b.moodScore - a.moodScore)
        .slice(0, 3);
      results[cat].negative = results[cat].negative
        .sort((a, b) => a.moodScore - b.moodScore)
        .slice(0, 3);
    });

    res.json({
      results,
      sleepQuality,
      sleepHours,
      sleepMoodScore,
      date: targetDate.toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculateWeeklyAnova = async (req, res) => {
  try {
    const userId = req.user._id;
    const { start, end } = req.query;
    let startOfWeek, endOfWeek;

    if (start && end) {
      startOfWeek = new Date(start);
      endOfWeek = new Date(end);
      startOfWeek.setHours(0,0,0,0);
      endOfWeek.setHours(23,59,59,999);
    } else {
      const today = new Date();
      startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0,0,0,0);
      endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
    }

    // Fetch this week's mood logs
    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // Aggregate by category & activity
    const aggregate = {};
    let sleepQuality = null;
    let totalSleepHours = 0;
    let sleepDays = 0;
    let avgSleepHours = null;
    let sleepMoodScore = null;

    logs.forEach(log => {
      if (log.category === 'sleep') {
        totalSleepHours += log.hrs;
        sleepDays++;
      } else {
        // Only include logs with both before and after intensity
        if (
          log.beforeIntensity !== undefined && log.beforeIntensity !== null &&
          log.afterIntensity !== undefined && log.afterIntensity !== null
        ) {
          const key = `${log.category}_${log.activity}`;
          if (!aggregate[key]) {
            aggregate[key] = {
              category: log.category,
              activity: log.activity,
              totalBefore: 0,
              totalAfter: 0,
              count: 0
            };
          }
          aggregate[key].totalBefore += log.beforeIntensity;
          aggregate[key].totalAfter += log.afterIntensity;
          aggregate[key].count += 1;
        }
      }
    });

    // Calculate average sleep and quality
    if (sleepDays > 0) {
      avgSleepHours = Math.round((totalSleepHours / sleepDays) * 10) / 10; // Round to 1 decimal

      if (avgSleepHours <= 5) sleepQuality = 'Poor';
      else if (avgSleepHours >= 6 && avgSleepHours <= 8) sleepQuality = 'Sufficient';
      else if (avgSleepHours > 8) sleepQuality = 'Good';

      // Calculate weekly sleep mood score
      if (avgSleepHours >= 7 && avgSleepHours <= 9) {
        sleepMoodScore = Math.round(((avgSleepHours - 4) / 5) * 80); // Positive score
      } else if (avgSleepHours < 7) {
        sleepMoodScore = Math.round(((avgSleepHours - 7) / 7) * 100); // Negative score
      } else if (avgSleepHours > 9) {
        sleepMoodScore = Math.round(((9 - avgSleepHours) / 2) * 30); // Slightly negative
      }
    }

    // Calculate moodScore for activities
    const scores = [];
    for (const key in aggregate) {
      const { category, activity, totalBefore, totalAfter, count } = aggregate[key];
      const diff = totalAfter - totalBefore;
      const maxScore = count * 5;
      const moodScore = Math.round(((diff / maxScore) * 100)); // percentage

      scores.push({ category, activity, moodScore });
    }

    // Separate top positive and negative per category
    const results = {};
    scores.forEach(score => {
      if (!results[score.category]) results[score.category] = { positive: [], negative: [] };
      if (score.moodScore > 0) results[score.category].positive.push(score);
      else if (score.moodScore < 0) results[score.category].negative.push(score);
    });

    // Sort and slice top 3 for each
    Object.keys(results).forEach(cat => {
      results[cat].positive = results[cat].positive
        .sort((a, b) => b.moodScore - a.moodScore)
        .slice(0, 3);
      results[cat].negative = results[cat].negative
        .sort((a, b) => a.moodScore - b.moodScore)
        .slice(0, 3);
    });

    res.json({ results, sleepQuality, avgSleepHours, sleepMoodScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSleepHours = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'weekly' } = req.query;
    
    let startDate, endDate;
    const today = new Date();
    
    if (period === 'weekly') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // End of current week (Saturday)
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monthly
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch sleep logs for the period from MoodLog where category is 'sleep'
    const sleepLogs = await MoodLog.find({
      user: userId,
      category: 'sleep',
      date: { $gte: startDate, $lte: endDate },
      hrs: { $exists: true, $ne: null } // Ensure hrs field exists and is not null
    }).sort({ date: 1 });

    // Group by date and sum hours if multiple entries per day
    const sleepByDate = {};
    sleepLogs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0]; // Use ISO date string for consistency
      if (!sleepByDate[dateKey]) {
        sleepByDate[dateKey] = { date: log.date, totalHours: 0, count: 0 };
      }
      sleepByDate[dateKey].totalHours += log.hrs || 0;
      sleepByDate[dateKey].count += 1;
    });

    // Convert to array and calculate averages
    const sleepHoursData = Object.values(sleepByDate)
      .map(entry => ({
        date: entry.date,
        hours: Math.round((entry.totalHours / entry.count) * 10) / 10
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

    // Calculate analytics
    let analytics = null;
    if (sleepHoursData.length > 0) {
      const totalHours = sleepHoursData.reduce((sum, entry) => sum + entry.hours, 0);
      const averageHours = Math.round((totalHours / sleepHoursData.length) * 10) / 10;
      
      // Find best and worst days
      const bestEntry = sleepHoursData.reduce((best, current) => 
        current.hours > best.hours ? current : best
      );
      const worstEntry = sleepHoursData.reduce((worst, current) => 
        current.hours < worst.hours ? current : worst
      );

      // Generate insights based on sleep patterns
      let consistency = 'Good';
      let recommendation = 'Keep up the great sleep routine!';
      
      const hoursArray = sleepHoursData.map(d => d.hours);
      const hoursRange = Math.max(...hoursArray) - Math.min(...hoursArray);
      
      if (hoursRange > 3) {
        consistency = 'Inconsistent';
        recommendation = 'Try to maintain a more regular sleep schedule for better rest quality.';
      } else if (averageHours < 6) {
        consistency = hoursRange > 2 ? 'Poor & Inconsistent' : 'Insufficient';
        recommendation = 'Consider getting more sleep for better health and mood stability.';
      } else if (averageHours > 9) {
        consistency = hoursRange > 2 ? 'Excessive & Inconsistent' : 'Excessive';
        recommendation = 'You might be getting too much sleep. Check if this affects your energy levels.';
      } else if (averageHours >= 7 && averageHours <= 8) {
        consistency = 'Optimal';
        recommendation = 'Perfect! You\'re maintaining an ideal sleep schedule.';
      }

      analytics = {
        averageHours,
        bestDay: period === 'weekly' 
          ? new Date(bestEntry.date).toLocaleDateString('en-US', { weekday: 'long' })
          : new Date(bestEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bestDayHours: bestEntry.hours,
        worstDay: period === 'weekly' 
          ? new Date(worstEntry.date).toLocaleDateString('en-US', { weekday: 'long' })
          : new Date(worstEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        worstDayHours: worstEntry.hours,
        consistency,
        recommendation,
        totalDays: sleepHoursData.length,
        optimalDays: hoursArray.filter(h => h >= 7 && h <= 9).length
      };
    }

    res.json({ sleepHoursData, analytics });
  } catch (err) {
    console.error('Error fetching sleep hours:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMoodActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { emotion, moodType, period } = req.query;

    if (!emotion || !moodType || !period) {
      return res.status(400).json({ 
        message: 'Missing required parameters: emotion, moodType, and period' 
      });
    }

    // Calculate date range based on period
    let startOfPeriod, endOfPeriod;
    const moment = require('moment');
    
    if (period === 'weekly') {
      startOfPeriod = moment().startOf('isoWeek').toDate();
      endOfPeriod = moment().endOf('isoWeek').toDate();
    } else if (period === 'daily') {
      startOfPeriod = moment().startOf('day').toDate();
      endOfPeriod = moment().endOf('day').toDate();
    } else if (period === 'monthly') {
      startOfPeriod = moment().startOf('month').toDate();
      endOfPeriod = moment().endOf('month').toDate();
    } else {
      return res.status(400).json({ message: 'Invalid period. Use daily, weekly, or monthly' });
    }

    // Build query based on moodType (before or after)
    let query = {
      user: userId,
      date: {
        $gte: startOfPeriod,
        $lte: endOfPeriod
      }
    };

    // Add emotion filter based on moodType
    if (moodType === 'before') {
      query.beforeEmotion = emotion.toLowerCase();
    } else {
      query.afterEmotion = emotion.toLowerCase();
    }

    const moodLogs = await MoodLog.find(query);

    // Count activities by category and activity, calculate percentages
    const activityCounts = {};
    let totalEntries = moodLogs.length;

    if (totalEntries === 0) {
      return res.json({
        activities: [],
        categoryBreakdown: [],
        totalEntries: 0,
        emotion: emotion,
        moodType: moodType,
        period: period,
        dateRange: {
          start: startOfPeriod,
          end: endOfPeriod
        }
      });
    }

    moodLogs.forEach(log => {
      let activityKey;
      
      // Handle different categories based on your schema
      if (log.category === 'sleep') {
        activityKey = `Sleep - ${log.hrs} hours`;
      } else {
        // For activity, social, health categories
        const activity = log.activity || 'Unknown Activity';
        const categoryName = log.category.charAt(0).toUpperCase() + log.category.slice(1);
        activityKey = `${categoryName}: ${activity}`;
      }

      if (activityCounts[activityKey]) {
        activityCounts[activityKey]++;
      } else {
        activityCounts[activityKey] = 1;
      }
    });

    // Convert to array and calculate percentages
    const activities = Object.entries(activityCounts)
      .map(([activity, count]) => ({
        activity: activity,
        count: count,
        percentage: parseFloat(((count / totalEntries) * 100).toFixed(1))
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Category breakdown for additional insights
    const categoryBreakdown = {};
    moodLogs.forEach(log => {
      const category = log.category.charAt(0).toUpperCase() + log.category.slice(1);
      if (categoryBreakdown[category]) {
        categoryBreakdown[category]++;
      } else {
        categoryBreakdown[category] = 1;
      }
    });

    const categoryStats = Object.entries(categoryBreakdown)
      .map(([category, count]) => ({
        category: category,
        count: count,
        percentage: parseFloat(((count / totalEntries) * 100).toFixed(1))
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Additional statistics
    const stats = {
      totalEntries,
      uniqueActivities: activities.length,
      topActivity: activities[0]?.activity || 'None',
      topActivityPercentage: activities[0]?.percentage || 0,
      topCategory: categoryStats[0]?.category || 'None',
      topCategoryPercentage: categoryStats[0]?.percentage || 0
    };

    res.json({
      activities: activities,
      categoryBreakdown: categoryStats,
      totalEntries: totalEntries,
      emotion: emotion,
      moodType: moodType,
      period: period,
      stats: stats,
      dateRange: {
        start: startOfPeriod,
        end: endOfPeriod
      }
    });

  } catch (error) {
    console.error('Error fetching mood activities:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};