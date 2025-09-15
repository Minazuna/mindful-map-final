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
      afterEmotion: log.afterEmotion
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
        afterEmotion: log.afterEmotion,
        afterValence: log.afterValence
      })));
    }

    if (moodLogs.length === 0) {
      console.log('🔍 No mood logs found - returning empty data');
      return res.json({
        success: true,
        data: {
          totalEntries: 0,
          mostProminentValence: null,
          emotionCounts: {},
          timeSegmentMoods: {
            morning: null,
            afternoon: null,
            evening: null
          },
          date: targetDate.toISOString().split('T')[0]
        }
      });
    }

    // Analyze after emotions
    const afterEmotions = moodLogs.map(log => ({
      emotion: log.afterEmotion,
      valence: log.afterValence,
      intensity: log.afterIntensity,
      time: new Date(log.date)
    }));

    console.log('🔍 After emotions extracted:', afterEmotions);

    // Calculate most prominent valence
    const valenceCounts = { positive: 0, negative: 0 };
    afterEmotions.forEach(emotion => {
      if (emotion.valence === 'positive') valenceCounts.positive++;
      if (emotion.valence === 'negative') valenceCounts.negative++;
    });

    const mostProminentValence = valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Count emotion occurrences
    const emotionCounts = {};
    afterEmotions.forEach(emotion => {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    // Categorize by time segments and find most prominent mood for each
    const timeSegments = {
      morning: [], // 5:00 AM – 11:59 AM
      afternoon: [], // 12:00 PM – 5:59 PM
      evening: [] // 6:00 PM onwards
    };

    afterEmotions.forEach(emotion => {
      const hour = emotion.time.getHours();
      
      if (hour >= 5 && hour < 12) {
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
          segmentEmotionCounts[emotion.emotion] = (segmentEmotionCounts[emotion.emotion] || 0) + 1;
        });

        // Find most frequent emotion
        const mostFrequentEmotion = Object.keys(segmentEmotionCounts).reduce((a, b) => 
          segmentEmotionCounts[a] > segmentEmotionCounts[b] ? a : b
        );

        // Calculate average intensity for this emotion in this segment
        const emotionInstances = emotions.filter(e => e.emotion === mostFrequentEmotion);
        const avgIntensity = emotionInstances.reduce((sum, e) => sum + e.intensity, 0) / emotionInstances.length;

        timeSegmentMoods[segment] = {
          emotion: mostFrequentEmotion,
          count: segmentEmotionCounts[mostFrequentEmotion],
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          totalEntries: emotions.length
        };
      }
    });

    const avgIntensity = afterEmotions.length > 0 
      ? afterEmotions.reduce((sum, e) => sum + e.intensity, 0) / afterEmotions.length 
      : 0;

    const responseData = {
      totalEntries: moodLogs.length,
      mostProminentValence: mostProminentValence,
      valenceCounts: valenceCounts,
      emotionCounts: emotionCounts,
      timeSegmentMoods: timeSegmentMoods,
      date: targetDate.toISOString().split('T')[0],
      averageIntensity: avgIntensity
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
          totalEntries: 0,
          mostProminentValence: null,
          emotionCounts: {},
          valenceCounts: { positive: 0, negative: 0 },
          averageIntensity: 0,
          dailyBreakdown: {},
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0]
        }
      });
    }

    // Analyze after emotions
    const afterEmotions = moodLogs.map(log => ({
      emotion: log.afterEmotion,
      valence: log.afterValence,
      intensity: log.afterIntensity,
      date: new Date(log.date)
    }));

    console.log('🔍 After emotions extracted:', afterEmotions.length);

    // Calculate most prominent valence
    const valenceCounts = { positive: 0, negative: 0 };
    afterEmotions.forEach(emotion => {
      if (emotion.valence === 'positive') valenceCounts.positive++;
      if (emotion.valence === 'negative') valenceCounts.negative++;
    });

    const mostProminentValence = valenceCounts.positive >= valenceCounts.negative ? 'positive' : 'negative';

    // Count emotion occurrences
    const emotionCounts = {};
    afterEmotions.forEach(emotion => {
      emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
    });

    // Calculate average intensity
    const avgIntensity = afterEmotions.length > 0 
      ? afterEmotions.reduce((sum, e) => sum + e.intensity, 0) / afterEmotions.length 
      : 0;

    // Create daily breakdown
    const dailyBreakdown = {};
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Initialize all days
    daysOfWeek.forEach(day => {
      dailyBreakdown[day] = {
        count: 0,
        emotions: {},
        dominantEmotion: null
      };
    });

    // Group emotions by day of week
    afterEmotions.forEach(emotion => {
      const dayOfWeek = emotion.date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (dailyBreakdown[dayOfWeek]) {
        dailyBreakdown[dayOfWeek].count++;
        
        // Count emotions for this day
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
      // Remove the detailed emotions object to keep response clean
      delete dayData.emotions;
    });

    const responseData = {
      totalEntries: moodLogs.length,
      mostProminentValence: mostProminentValence,
      valenceCounts: valenceCounts,
      emotionCounts: emotionCounts,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
      dailyBreakdown: dailyBreakdown,
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
    const today = new Date();
    today.setHours(0,0,0,0);

    // Fetch today's mood logs
    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24*60*60*1000) }
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
          // Optimal range: positive score
          sleepMoodScore = Math.round(((sleepHours - 4) / 5) * 80); // Up to 80% positive
        } else if (sleepHours < 7) {
          // Too little sleep: negative score
          sleepMoodScore = Math.round(((sleepHours - 7) / 7) * 100); // Negative score
        } else if (sleepHours > 9) {
          // Too much sleep: slightly negative
          sleepMoodScore = Math.round(((9 - sleepHours) / 2) * 30); // Slightly negative for oversleeping
        }
      } else {
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
        { user: userId, date: today, category, activity },
        { moodScore },
        { upsert: true, new: true }
      );

      scores.push({ category, activity, moodScore });
    }

    // Get top 3 per category
    const topResults = {};
    scores.forEach(score => {
      if (!topResults[score.category]) topResults[score.category] = [];
      topResults[score.category].push(score);
    });
    Object.keys(topResults).forEach(cat => {
      topResults[cat] = topResults[cat]
        .sort((a, b) => b.moodScore - a.moodScore)
        .slice(0, 3);
    });

    res.json({ topResults, sleepQuality, sleepHours, sleepMoodScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};