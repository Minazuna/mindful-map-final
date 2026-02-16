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

// Helper: build local day bounds [start, next)
function localDayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setDate(start.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return { start, next };
}

// Compute means and counts from MoodScore docs for one category
function computeMeansAndCountsFromDocs(docs = []) {
  const byAct = new Map();
  for (const d of docs) {
    const a = d.activity || 'unknown';
    if (!byAct.has(a)) byAct.set(a, { sum: 0, count: 0 });
    const s = byAct.get(a);
    s.sum += Number(d.moodScore) || 0;
    s.count += 1;
  }
  const groupMeans = {};
  const groupCounts = {};
  for (const [a, { sum, count }] of byAct.entries()) {
    if (count > 0) {
      groupMeans[a] = +(sum / count).toFixed(2);
      groupCounts[a] = count;
    }
  }
  return { groupMeans, groupCounts };
}

// Derive "top" lists from means/counts (≥2 logs)
function computeTopListsFromMeans(means = {}, counts = {}, minN = 2, limit = 5) {
  const rows = Object.entries(means)
    .filter(([name]) => (counts[name] || 0) >= minN)
    .map(([name, avg]) => ({ activity: name, moodScore: +(+avg).toFixed(2) }));

  const topPositive = rows.filter(r => r.moodScore > 0).sort((a, b) => b.moodScore - a.moodScore).slice(0, limit);
  const topNegative = rows.filter(r => r.moodScore < 0).sort((a, b) => a.moodScore - b.moodScore).slice(0, limit);
  return { topPositive, topNegative };
}

// Strictly filter groups by local counts (>=2)
function sanitizeByCounts(dataMap) {
  const counts = Object.fromEntries(Object.entries(dataMap).map(([k, arr]) => [k, (arr?.length || 0)]));
  const included = Object.keys(counts).filter(k => counts[k] >= 2);
  return { counts, included };
}

// Build latest MoodScore _id per activity from docs
function buildLatestIdsMap(docs = []) {
  const latestByAct = {};
  for (const d of docs) {
    const a = d.activity || 'unknown';
    const ts = new Date(d.date).getTime();
    const prevTs = latestByAct[a]?.ts ?? -Infinity;
    if (ts >= prevTs) {
      latestByAct[a] = { id: d._id, ts };
    }
  }
  const map = {};
  Object.entries(latestByAct).forEach(([a, v]) => { map[a] = v.id; });
  return map;
}

// Build payload from a saved snapshot, but re-check counts using live MoodScore docs (min 2 per activity)
// Also compute groupLastIds strictly from MoodScore docs within the day.
async function buildSavedPayload(userId, startDate, nextDate, category) {
  const saved = await AnovaResult.findOne({
    user: userId,
    category,
    date: { $gte: startDate, $lt: nextDate }
  }).lean();
  if (!saved) return null;

  const gmRaw = saved.anova?.groupMeans || {};
  const gcRaw = saved.anova?.groupCounts || {};

  // Rebuild true counts and collect today's MoodScore docs for this category
  const msDocs = await MoodScore.find({
    user: userId,
    date: { $gte: startDate, $lt: nextDate },
    category
  }).select('activity date moodScore').lean();

  const trueCounts = {};
  for (const d of msDocs) {
    const a = d.activity || 'unknown';
    trueCounts[a] = (trueCounts[a] || 0) + 1;
  }

  // Allowed = strictly those with true count ≥2 today
  const allowed = Object.keys(trueCounts).filter(a => (trueCounts[a] || 0) >= 2);
  const allowSet = new Set(allowed);

  // Build means/counts restricted to allowed
  const groupMeans = {};
  const groupCounts = {};
  for (const g of allowSet) {
    if (typeof gmRaw[g] === 'number') groupMeans[g] = gmRaw[g];
    if (typeof trueCounts[g] === 'number') groupCounts[g] = trueCounts[g];
  }

  // Filter Tukey rows to allowed set
  const tukeyHSD = normalizeTukey(saved.tukeyHSD || []).filter(r => allowSet.has(r.group1) && allowSet.has(r.group2));

  // Always recompute top lists from filtered means/counts (ignore saved lists)
  const { topPositive, topNegative } = computeTopListsFromMeans(groupMeans, groupCounts);

  // Build ignoredGroups list for transparency (anything seen but not allowed)
  const allSeen = new Set([
    ...Object.keys(gcRaw),
    ...Object.keys(trueCounts),
    ...Object.keys(gmRaw)
  ]);
  const ignoredGroups = [...allSeen].filter(g => !allowSet.has(g));

  // groupLastIds (latest MoodScore id per activity for that day), restricted to allowed
  const msDocsWithIds = await MoodScore.find({
    user: userId,
    date: { $gte: startDate, $lt: nextDate },
    category
  }).select('activity date _id').lean();
  const latestIdsMap = buildLatestIdsMap(msDocsWithIds);
  const groupLastIds = {};
  for (const g of allowSet) {
    if (latestIdsMap[g]) groupLastIds[g] = latestIdsMap[g];
  }

  // If nothing has ≥2 today, return an insufficient payload
  if (allowed.length === 0) {
    return {
      insufficient: true,
      message: 'Not enough logs per activity (need ≥2 each).',
      includedGroups: [],
      ignoredGroups,
      tukeyHSD: [],
      tukeyInfo: saved.anova?.tukeyInfo || {},
      groupMeans: {},
      groupCounts: {},
      groupLastIds: {},
      topPositive: [],
      topNegative: []
    };
  }

  return {
    success: true,
    F_value: saved.anova?.F_value,
    p_value: saved.anova?.p_value,
    MSB: saved.anova?.MSB,
    MSW: saved.anova?.MSW,
    interpretation: saved.anova?.interpretation,
    includedGroups: [...allowSet],
    ignoredGroups,
    tukeyHSD,
    tukeyInfo: saved.anova?.tukeyInfo || {},
    groupMeans,
    groupCounts,
    groupLastIds,
    topPositive,
    topNegative
  };
}

exports.runAnovaForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const { start: targetDate, next: nextDate } = localDayBounds(date);
    const categories = ['activity', 'social', 'health'];

    // Fetch logs in local bounds
    const logs = await MoodLog.find({
      user: userId,
      date: { $gte: targetDate, $lt: nextDate }
    });

    // If no logs, return saved payloads (filtered to true counts ≥2) + sleep if present
    if (!logs || logs.length === 0) {
      const anovaResultsForFrontend = {};
      for (const cat of categories) {
        const payload = await buildSavedPayload(userId, targetDate, nextDate, cat);
        if (payload) anovaResultsForFrontend[cat] = payload;
      }

      const sleepScore = await MoodScore.findOne({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate },
        category: 'sleep'
      }).lean();

      const sleepData = sleepScore
        ? { quality: sleepScore.sleepQuality, hours: sleepScore.sleepHours, moodScore: sleepScore.moodScore, _id: sleepScore._id }
        : null;

      return res.json({
        success: Object.keys(anovaResultsForFrontend).length > 0 || !!sleepData,
        anovaResults: anovaResultsForFrontend,
        sleep: sleepData,
        message: Object.keys(anovaResultsForFrontend).length === 0 && !sleepData ? 'No logs or saved results for this day.' : undefined
      });
    }

    // Recompute mood scores for non-sleep logs
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
    if (sleepHours <= 5) sleepQuality = 'Poor';
    else if (sleepHours >= 6 && sleepHours <= 8) sleepQuality = 'Sufficient';
    else if (sleepHours > 8) sleepQuality = 'Good';

    // Always compute a moodScore for sleep
    if (typeof sleepHours === 'number') {
      // Use your existing formula, or fallback to a negative score
      if (sleepHours >= 7 && sleepHours <= 9) {
        sleepMoodScore = Math.round(((sleepHours - 4) / 5) * 80);
      } else if (sleepHours < 7) {
        sleepMoodScore = Math.round(((sleepHours - 7) / 7) * 100);
      } else if (sleepHours > 9) {
        sleepMoodScore = Math.round(((9 - sleepHours) / 2) * 30);
      }
      // Always set a value, even if it's negative
      if (isNaN(sleepMoodScore)) sleepMoodScore = -100;
    }
  }
});

    if (sleepHours !== null && sleepMoodScore !== null) {
      // Use date RANGE for upsert
      const sleepScore = await MoodScore.findOneAndUpdate(
        { user: userId, category: 'sleep', activity: 'sleep', date: { $gte: targetDate, $lt: nextDate } },
        { $set: { moodScore: sleepMoodScore, sleepHours, sleepQuality }, $setOnInsert: { date: targetDate } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      sleepMoodScoreId = sleepScore ? sleepScore._id : null;
    }

    // Compute per-log mood scores
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

    const savedResults = [];
    const anovaResultsForFrontend = {};

    for (const category of categories) {
      const moodScores = await MoodScore.find({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate },
        category
      });

      // Build arrays for Python
      const dataForPython = { data: { [category]: {} } };
      moodScores.forEach(doc => {
        const activityName = doc.activity || 'unknown';
        if (!dataForPython.data[category][activityName]) dataForPython.data[category][activityName] = [];
        dataForPython.data[category][activityName].push(doc.moodScore);
      });

      const groupsMap = dataForPython.data[category];

      // If no groups, return saved payload (filtered to true counts ≥2)
      if (!Object.keys(groupsMap).length) {
        const payload = await buildSavedPayload(userId, targetDate, nextDate, category);
        if (payload) anovaResultsForFrontend[category] = payload;
        continue;
      }

      // Local counts and included groups (min 2)
      const { counts: localCounts, included: localIncluded } = sanitizeByCounts(groupsMap);

      // If nothing with ≥2 logs, use saved payload or mark insufficient
      if (localIncluded.length === 0) {
        const payload = await buildSavedPayload(userId, targetDate, nextDate, category);
        if (payload) {
          anovaResultsForFrontend[category] = payload;
          continue;
        }
        anovaResultsForFrontend[category] = {
          insufficient: true,
          message: 'Not enough logs per activity (need ≥2 each).',
          ignoredGroups: Object.keys(localCounts)
        };
        continue;
      }

      const pythonApiUrl = process.env.PYTHON_API_URL;
      const token = req.headers.authorization;

      const pythonResponse = await fetch(`${pythonApiUrl}/api/run-anova`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ data: { [category]: groupsMap } })
      });

      const pythonData = await pythonResponse.json();
      const resultData = pythonData?.results?.[category];

      // If Python insufficient/fails, fallback to saved payload or mark insufficient with local info
      if (!pythonData.success || !resultData || resultData.success === false) {
        const payload = await buildSavedPayload(userId, targetDate, nextDate, category);
        if (payload) {
          anovaResultsForFrontend[category] = payload;
          continue;
        }
        anovaResultsForFrontend[category] = {
          insufficient: true,
          message:
            (resultData && resultData.message) ||
            pythonData.message ||
            'Logs are still insufficient to run a proper analysis. Come back later!',
          ignoredGroups: Object.keys(localCounts).filter(g => (localCounts[g] || 0) < 2)
        };
        continue;
      }

      // Always compute counts from our own arrays
      const groupCounts = localCounts;

      // Filter Tukey pairs to only those with both groups in localIncluded
      let tukeyRows = normalizeTukey(resultData.tukeyHSD).filter(r =>
        localIncluded.includes(r.group1) && localIncluded.includes(r.group2)
      );

      // Means: only keep means for localIncluded groups
      const filteredMeans = {};
      const filteredCounts = {};
      for (const g of localIncluded) {
        if (typeof resultData.groupMeans?.[g] === 'number') filteredMeans[g] = resultData.groupMeans[g];
        if (typeof groupCounts[g] === 'number') filteredCounts[g] = groupCounts[g];
      }

      // Build groupLastIds (latest MoodScore id per activity restricted to localIncluded)
      const msDocsWithIds = await MoodScore.find({
        user: userId,
        date: { $gte: targetDate, $lt: nextDate },
        category
      }).select('activity date _id').lean();
      const latestIdsMap = buildLatestIdsMap(msDocsWithIds);
      const groupLastIds = {};
      for (const g of localIncluded) {
        if (latestIdsMap[g]) groupLastIds[g] = latestIdsMap[g];
      }

      // Persist snapshot (store filtered means/counts and includedGroups strictly from local counts)
      // Use findOneAndUpdate to avoid VersionError
      const anovaPayload = {
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: localIncluded,
        ignoredGroups: Object.keys(groupCounts).filter(g => !localIncluded.includes(g)),
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: filteredMeans,
        groupCounts: filteredCounts
      };

      const { topPositive, topNegative } = computeTopListsFromMeans(anovaPayload.groupMeans, anovaPayload.groupCounts);

      // Anchor saved document at local NOON to avoid UTC previous-day display
      const localNoonAnchor = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0, 0);

      const result = await AnovaResult.findOneAndUpdate(
        {
          user: userId,
          category,
          date: { $gte: targetDate, $lt: nextDate }
        },
        {
          $set: {
            date: localNoonAnchor,
            anova: anovaPayload,
            topPositive,
            topNegative,
            tukeyHSD: tukeyRows
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      savedResults.push(result);

      // Frontend payload (strict)
      anovaResultsForFrontend[category] = {
        success: true,
        F_value: resultData.F_value,
        p_value: resultData.p_value,
        MSB: resultData.MSB,
        MSW: resultData.MSW,
        interpretation: resultData.interpretation,
        includedGroups: localIncluded,
        ignoredGroups: Object.keys(groupCounts).filter(g => !localIncluded.includes(g)),
        tukeyHSD: tukeyRows,
        tukeyInfo: resultData.tukeyInfo || {},
        groupMeans: filteredMeans,
        groupCounts: filteredCounts,
        groupLastIds, // added for Recommendation button linking
        topPositive,
        topNegative
      };
    }

    const sleepData = (sleepHours !== null && sleepMoodScore !== null)
      ? { quality: sleepQuality, hours: sleepHours, moodScore: sleepMoodScore, _id: sleepMoodScoreId }
      : null;

    // Final fallback: return saved payloads if recomputation produced none
    if (Object.keys(anovaResultsForFrontend).length === 0 && !sleepData) {
      const payload = {};
      for (const cat of ['activity', 'social', 'health']) {
        const p = await buildSavedPayload(userId, targetDate, nextDate, cat);
        if (p) payload[cat] = p;
      }

      if (Object.keys(payload).length > 0) {
        return res.json({
          success: true,
          anovaResults: payload,
          sleep: sleepData || null
        });
      }

      return res.json({
        success: false,
        message: 'Logs are still insufficient to run a proper analysis. Come back later!',
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


// Historical fetch: use local bounds and inclusive end by converting to next local midnight
exports.getHistoricalAnova = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }

    const { start: startLocal } = localDayBounds(startDate);
    const { next: endNextLocal } = localDayBounds(endDate);

    const anovaResults = await AnovaResult.find({
      user: userId,
      date: { $gte: startLocal, $lt: endNextLocal }
    }).lean();

    const moodScores = await MoodScore.find({
      user: userId,
      date: { $gte: startLocal, $lt: endNextLocal }
    }).lean();

    const anovaByDate = {};
    anovaResults.forEach(result => {
      const dt = new Date(result.date);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
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
      const dt = new Date(ms.date);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
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