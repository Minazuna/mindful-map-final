const fetch = require('node-fetch');
const AnovaResult = require('../models/AnovaResult');
const MoodScore = require('../models/MoodScore');
const MoodLog = require('../models/MoodLog');

// Normalize Tukey rows (Python sends 'p-adj' or 'p_adj')
const normalizeTukey = rows =>
  (rows || []).map(r => ({
    group1: r.group1,
    group2: r.group2,
    meandiff: r.meandiff,
    p_adj: r['p-adj'] ?? r.p_adj ?? null,
    lower: r.lower,
    upper: r.upper,
    reject: r.reject
  }));

// Run ANOVA for a single day; frontend now uses groupMeans only (no topPositive/topNegative)
exports.runAnovaForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const inputDate = new Date(date);
    const targetDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
    const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Fetch mood logs for the day
    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: targetDate, $lt: nextDate }
    });

    // Clear previous non-sleep mood scores for this day (recompute fresh)
    await MoodScore.deleteMany({
      user: userId,
      date: { $gte: targetDate, $lt: nextDate },
      category: { $ne: 'sleep' }
    });

    // Sleep extraction
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

    // Compute per-log mood scores for other categories (raw % diff baseline)
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
          date: log.date,
          category: log.category,
          activity: log.activity,
          moodScore
        });
      }
    }

    const categories = ['activity', 'social', 'health'];
    const savedResults = [];
    const anovaResultsForFrontend = {};

    for (const category of categories) {
      const moodScores = await MoodScore.find({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate },
        category
      });

      // Build data structure for Python
      const dataForPython = { data: { [category]: {} } };
      moodScores.forEach(doc => {
        const activityName = doc.activity || 'unknown';
        if (!dataForPython.data[category][activityName]) dataForPython.data[category][activityName] = [];
        dataForPython.data[category][activityName].push(doc.moodScore);
      });

      if (!Object.keys(dataForPython.data[category]).length) continue;

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
      const resultData = pythonData?.results?.[category];

      if (!pythonData.success || !resultData || resultData.success === false) {
        const message =
          (resultData && resultData.message) ||
          pythonData.message ||
          'Logs are still insufficient to run a proper analysis. Come back later!';
        const ignoredGroups =
          (resultData && resultData.ignoredGroups) ||
          Object.entries(dataForPython.data[category])
            .filter(([, arr]) => (arr?.length || 0) < 2)
            .map(([name]) => name);

        anovaResultsForFrontend[category] = {
          insufficient: true,
          message,
          ignoredGroups
        };
        continue;
      }

      // Normalize Tukey results
      let tukeyRows = normalizeTukey(resultData.tukeyHSD);

      // Ensure groupCounts present (fallback if Python did not include)
      const groupCounts = resultData.groupCounts && Object.keys(resultData.groupCounts).length
        ? resultData.groupCounts
        : Object.fromEntries(
            Object.entries(dataForPython.data[category]).map(([activity, arr]) => [activity, arr.length])
          );

      // Filter Tukey pairs to only those with both groups >= 2 logs (frontend matches this)
      tukeyRows = tukeyRows.filter(r =>
        (groupCounts[r.group1] || 0) >= 2 && (groupCounts[r.group2] || 0) >= 2
      );

      // Persist (drop topPositive/topNegative since not used now)
      let result = await AnovaResult.findOne({ user: userId, category, date: targetDate });
      const anovaPayload = {
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: resultData.includedGroups || [],
        ignoredGroups: resultData.ignoredGroups || [],
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: resultData.groupMeans || {},
        groupCounts
      };

      if (!result) {
        result = new AnovaResult({
          user: userId,
          category,
          date: targetDate,
          anova: anovaPayload,
          topPositive: [], // retained fields but empty
          topNegative: [],
          tukeyHSD: tukeyRows
        });
      } else {
        result.anova = anovaPayload;
        result.topPositive = [];
        result.topNegative = [];
        result.tukeyHSD = tukeyRows;
      }

      await result.save();
      savedResults.push(result);

      // Frontend payload
      anovaResultsForFrontend[category] = {
        success: true,
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: resultData.includedGroups || [],
        ignoredGroups: resultData.ignoredGroups || [],
        tukeyHSD: tukeyRows,
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: resultData.groupMeans || {},
        groupCounts
      };
    }

    const sleepData = (sleepHours !== null && sleepMoodScore !== null)
      ? { quality: sleepQuality, hours: sleepHours, moodScore: sleepMoodScore, _id: sleepMoodScoreId }
      : null;

    if (Object.keys(anovaResultsForFrontend).length === 0 && !sleepData) {
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

// Historical fetch unchanged except topPositive/topNegative may now be empty
exports.getHistoricalAnova = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const anovaResults = await AnovaResult.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    const moodScores = await MoodScore.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    const anovaByDate = {};
    anovaResults.forEach(result => {
      const dateKey = result.date.toISOString().split('T')[0];
      if (!anovaByDate[dateKey]) anovaByDate[dateKey] = {};
      anovaByDate[dateKey][result.category] = {
        anova: result.anova,
        topPositive: result.topPositive || [],
        topNegative: result.topNegative || [],
        tukeyHSD: result.tukeyHSD || []
      };
    });

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