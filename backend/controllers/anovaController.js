const fetch = require('node-fetch');
const AnovaResult = require('../models/AnovaResult');
const MoodScore = require('../models/MoodScore');
const MoodLog = require('../models/MoodLog');

// Run ANOVA for a single day and include Tukey HSD results
exports.runAnovaForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.body;

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    // Always use UTC midnight for targetDate and nextDate
    const inputDate = new Date(date);
    const targetDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
    const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: targetDate, $lt: nextDate }
    });

    // Remove all MoodScores for this user/date (except sleep, handled separately)
    await MoodScore.deleteMany({
      user: userId,
      date: { $gte: targetDate, $lt: nextDate },
      category: { $ne: 'sleep' }
    });

    // --- Sleep calculation (not part of ANOVA) ---
    let sleepQuality = null;
    let sleepHours = null;
    let sleepMoodScore = null;
    let sleepMoodScoreId = null;
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
      }
    });
    if (sleepHours !== null && sleepMoodScore !== null) {
      const sleepScore = await MoodScore.findOneAndUpdate(
        { user: userId, date: targetDate, category: 'sleep', activity: 'sleep' },
        { moodScore: sleepMoodScore, sleepHours },
        { upsert: true, new: true }
      );
      sleepMoodScoreId = sleepScore ? sleepScore._id : null;
    }

    // Save MoodScore for each MoodLog (not aggregated, except sleep)
    for (const log of logs) {
      if (
        log.category !== 'sleep' &&
        log.beforeIntensity !== undefined && log.beforeIntensity !== null &&
        log.afterIntensity !== undefined && log.afterIntensity !== null
      ) {
        const diff = log.afterIntensity - log.beforeIntensity;
        const moodScore = Math.round((diff / 5) * 100);
        await MoodScore.create({
          user: userId,
          date: log.date, // use the exact log date
          category: log.category,
          activity: log.activity,
          moodScore
        });
      }
    }

    // --- For each non-sleep category, run ANOVA ---
    const categories = ['activity', 'social', 'health'];
    const savedResults = [];
    const anovaResultsForFrontend = {};

    for (const category of categories) {
      const moodScores = await MoodScore.find({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate },
        category
      });

      // Format data for Python
      const dataForPython = { data: {} };
      dataForPython.data[category] = {};
      moodScores.forEach(doc => {
        const activityName = doc.activity || 'unknown';
        if (!dataForPython.data[category][activityName]) dataForPython.data[category][activityName] = [];
        dataForPython.data[category][activityName].push(doc.moodScore);
      });

      if (!Object.keys(dataForPython.data[category]).length) {
        // No data for this category, skip
        continue;
      }

      // Send to Python
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
      const token = req.headers.authorization;

      const pythonResponse = await fetch(`${pythonApiUrl}/api/run-anova`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(dataForPython)
      });

      const pythonData = await pythonResponse.json();

      if (!pythonData.success) {
        // If logs are insufficient, just skip this category
        anovaResultsForFrontend[category] = {
          insufficient: true,
          message: pythonData.message || pythonData.error
        };
        continue;
      }

      const resultData = pythonData.results[category];

      // Map topPositive/topNegative to objects for Mongoose schema
      const mapTop = arr =>
        (arr || []).map(([activity, moodScore]) => ({
          activity,
          moodScore
        }));

      // Save in MongoDB (now includes tukeyHSD)
      let result = await AnovaResult.findOne({ user: userId, category, date: targetDate });
      if (!result) {
        result = new AnovaResult({
          user: userId,
          category,
          date: targetDate,
          anova: resultData,
          topPositive: mapTop(resultData.topPositive),
          topNegative: mapTop(resultData.topNegative),
          tukeyHSD: resultData.tukeyHSD || []
        });
      } else {
        result.anova = resultData;
        result.topPositive = mapTop(resultData.topPositive);
        result.topNegative = mapTop(resultData.topNegative);
        result.tukeyHSD = resultData.tukeyHSD || [];
      }

      await result.save();
      savedResults.push(result);

      // Prepare for frontend (include tukeyHSD)
      anovaResultsForFrontend[category] = {
        ...resultData,
        topPositive: mapTop(resultData.topPositive),
        topNegative: mapTop(resultData.topNegative),
        tukeyHSD: resultData.tukeyHSD || []
      };
    }

    // Prepare sleep data for frontend
    const sleepData = sleepHours !== null && sleepMoodScore !== null
      ? {
          quality: sleepQuality,
          hours: sleepHours,
          moodScore: sleepMoodScore,
          _id: sleepMoodScoreId
        }
      : null;

    // If all categories are insufficient, return friendly message
    if (
      Object.keys(anovaResultsForFrontend).length === 0 &&
      !sleepData
    ) {
      return res.json({
        success: false,
        message: 'Logs are still insufficient to run a proper analysis. Come back later!',
        savedResults: [],
        sleep: null
      });
    }

    res.json({
      success: true,
      savedResults,
      anovaResults: anovaResultsForFrontend,
      sleep: sleepData
    });
  } catch (err) {
    console.error('ANOVA Controller Error:', err);
    res.status(500).json({ success: false, message: 'Server error while running ANOVA', error: err.message });
  }
};

// Fetch historical ANOVA, MoodScores, and Tukey HSD for weekly/periodic analysis
exports.getHistoricalAnova = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch all AnovaResults in the date range
    const anovaResults = await AnovaResult.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Fetch all MoodScores in the date range
    const moodScores = await MoodScore.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Structure response: group anovaResults by date and category
    const anovaByDate = {};
    anovaResults.forEach(result => {
      const dateKey = result.date.toISOString().split('T')[0];
      if (!anovaByDate[dateKey]) anovaByDate[dateKey] = {};
      anovaByDate[dateKey][result.category] = {
        anova: result.anova,
        topPositive: result.topPositive,
        topNegative: result.topNegative,
        tukeyHSD: result.tukeyHSD || []
      };
    });

    // Group moodScores by date and category
    const moodScoresByDate = {};
    moodScores.forEach(ms => {
      const dateKey = ms.date.toISOString().split('T')[0];
      if (!moodScoresByDate[dateKey]) moodScoresByDate[dateKey] = {};
      if (!moodScoresByDate[dateKey][ms.category]) moodScoresByDate[dateKey][ms.category] = [];
      moodScoresByDate[dateKey][ms.category].push(ms);
    });

    res.json({
      success: true,
      anovaByDate,
      moodScoresByDate
    });
  } catch (err) {
    console.error('Historical ANOVA fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching historical ANOVA', error: err.message });
  }
};