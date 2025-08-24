const MoodLog = require('../models/MoodLog');

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