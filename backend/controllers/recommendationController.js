const fetch = require('node-fetch');
const MoodScore = require('../models/MoodScore');
const Recommendation = require('../models/Recommendation.js');
const RecommendationEffectiveness = require('../models/RecommendationEffectiveness');
const { getRecommendations } = require('../services/recommendEngine');

function getCurrentWeekRange() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const start = new Date(local);
  start.setDate(local.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isDateWithinCurrentWeek(d) {
  const { start, end } = getCurrentWeekRange();
  const dt = new Date(d);
  return dt >= start && dt <= end;
}

exports.generateAndSaveRecommendation = async (req, res) => {
  try {
    const { moodScoreId } = req.body;
    const moodScoreDoc = await MoodScore.findById(moodScoreId).populate('user');
    if (!moodScoreDoc) return res.status(404).json({ error: 'MoodScore not found' });

    const { _id, user, date, category, activity, moodScore, sleepHours } = moodScoreDoc;
    const moodType = moodScore >= 0 ? 'positive' : 'negative';

    const keyQuery = { user: user._id, date, category, activity };
    const existingForKey = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).lean();
    if (existingForKey.length > 0) {
    }

    const ineffectiveAgg = await RecommendationEffectiveness.aggregate([
      { 
        $match: { 
          user: user._id,
          effective: false 
        } 
      },
      {
        $group: {
          _id: '$recommendation',
          ineffectiveCount: { $sum: 1 }
        }
      },
      {
        $match: {
          ineffectiveCount: { $gte: 2 }
        }
      }
    ]);
    
    const ineffectiveRecIds = ineffectiveAgg.map(a => a._id);

    const ineffectiveRecs = await Recommendation.find({
      _id: { $in: ineffectiveRecIds },
      user: user._id,
      category,
      activity
    }).select('recommendation').lean();
    
    const blockedTexts = new Set(ineffectiveRecs.map(r => String(r.recommendation).trim().toLowerCase()));

    // Generate up to 3 unique recommendation texts
    let texts = getRecommendations({ category, activity, moodType, sleepHours, n: 10 }) || []; 
    
    // Filter out blocked (ineffective) recommendations
    texts = texts
      .map(t => String(t).trim())
      .filter(t => t && !blockedTexts.has(t.toLowerCase()))
      .slice(0, 3); 

    if (texts.length === 0 && existingForKey.length === 0) {
      return res.json({ recommendations: [] });
    }

    
    const toInsert = texts
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(tt => ({
        moodScore: _id,
        user: user._id,
        date,
        category,
        activity,
        moodScoreValue: moodScore,
        sleepHours,
        recommendation: tt,
        type: moodType
      }));

    if (toInsert.length) {
      try {
        await Recommendation.insertMany(toInsert, { ordered: false });
      } catch (e) {
        const msg = String(e?.message || '').toLowerCase();
        const isDup = e.code === 11000 || msg.includes('duplicate key') || msg.includes('e11000') || msg.includes('duplicate');
        if (!isDup) throw e;
      }
    }

    const final = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).limit(3).lean();

    // Attach feedback aggregates per recommendation so UI can show "Update effectiveness"
    const ids = final.map(r => r._id);
    const agg = await RecommendationEffectiveness.aggregate([
      { $match: { recommendation: { $in: ids } } },
      {
        $group: {
          _id: '$recommendation',
          count: { $sum: 1 },
          avgCombined: { $avg: '$combinedScore' },
          anyEffective: { $max: { $cond: ['$effective', 1, 0] } },
          ineffectiveCount: { 
            $sum: { $cond: [{ $eq: ['$effective', false] }, 1, 0] } 
          }
        }
      }
    ]);
    const byId = new Map(agg.map(a => [String(a._id), a]));
    const enriched = final.map(r => {
      const a = byId.get(String(r._id));
      return {
        ...r,
        effectivenessCount: a ? a.count : 0,
        effectivenessAvg: a ? a.avgCombined : 0,
        effective: a ? a.anyEffective === 1 : false,
        ineffectiveCount: a ? a.ineffectiveCount : 0
      };
    });

    return res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentWeekRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { start, end } = getCurrentWeekRange();

    const recs = await Recommendation.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean();

    // Enrich with aggregates (same as generate endpoint)
    const ids = recs.map(r => r._id);
    const agg = await RecommendationEffectiveness.aggregate([
      { $match: { recommendation: { $in: ids } } },
      {
        $group: {
          _id: '$recommendation',
          count: { $sum: 1 },
          avgCombined: { $avg: '$combinedScore' },
          anyEffective: { $max: { $cond: ['$effective', 1, 0] } }
        }
      }
    ]);
    const byId = new Map(agg.map(a => [String(a._id), a]));
    const enriched = recs.map(r => {
      const a = byId.get(String(r._id));
      return {
        ...r,
        effectivenessCount: a ? a.count : 0,
        effectivenessAvg: a ? a.avgCombined : 0,
        effective: a ? a.anyEffective === 1 : false
      };
    });

    res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Submit effectiveness feedback:
 * body: { recommendationId, rating (1-5), comment (string, optional) }
 * Allows rating only within the current week of the recommendation.
 * One rating per (recommendation, user): if exists, update; otherwise create.
 * Combines rating (80%) and sentiment (20% when comment >= 10 chars).
 * If no usable comment, use 100% rating.
 */
exports.submitRecommendationFeedback = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { recommendationId, rating, comment } = req.body || {};
    if (!recommendationId || rating == null) {
      return res.status(400).json({ error: 'recommendationId and rating are required' });
    }
    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    const rec = await Recommendation.findById(recommendationId).lean();
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    // Enforce: allow ratings only for recommendations within the current week
    if (!isDateWithinCurrentWeek(rec.date)) {
      return res.status(400).json({ error: 'Rating period has ended for this recommendation (outside current week).' });
    }

    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5002';
    const token = req.headers.authorization;

    const hasComment = typeof comment === 'string' && comment.trim().length >= 10;
    let sentimentScore = 0;

    if (hasComment) {
      try {
        const pyResponse = await fetch(`${pythonApiUrl}/api/sentiment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token || ''
          },
          body: JSON.stringify({ comment: comment || '' })
        });
        const ct = pyResponse.headers.get('content-type') || '';
        const pyData = ct.includes('application/json') ? await pyResponse.json() : {};
        if (pyResponse.ok && typeof pyData?.sentimentScore === 'number') {
          sentimentScore = Number(pyData.sentimentScore);
        }
      } catch (_) {
        sentimentScore = 0;
      }
    }

    const rNorm = (r - 1) / 4;
    const sNorm = hasComment ? (sentimentScore + 1) / 2 : 0;

    const ratingWeight = hasComment ? 0.8 : 1.0;
    const sentimentWeight = hasComment ? 0.2 : 0.0;

    let combinedScore = ratingWeight * rNorm + sentimentWeight * sNorm;
    combinedScore = Math.max(0, Math.min(1, combinedScore));

    const effective = combinedScore >= 0.65;

    // One rating per (recommendation, user): update if exists, else insert
    const update = {
      $set: {
        rating: r,
        comment: comment || '',
        sentimentScore,
        combinedScore,
        effective
      }
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    const feedbackDoc = await RecommendationEffectiveness.findOneAndUpdate(
      { recommendation: recommendationId, user: userId },
      update,
      options
    ).lean();

    // Update aggregates on Recommendation
    try {
      const agg = await RecommendationEffectiveness.aggregate([
        { $match: { recommendation: rec._id } },
        { $group: { _id: '$recommendation', avgCombined: { $avg: '$combinedScore' }, count: { $sum: 1 } } }
      ]);
      const avgCombined = agg?.[0]?.avgCombined ?? 0;
      const count = agg?.[0]?.count ?? 0;
      await Recommendation.updateOne(
        { _id: rec._id },
        { $set: { effectivenessAvg: avgCombined, effectivenessCount: count, effective } }
      );
    } catch (_) {}

    return res.json({
      feedback: feedbackDoc,
      sentimentScore,
      combinedScore,
      effective
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: return current user's feedback for a specific recommendation
exports.getUserFeedbackForRecommendation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { recommendationId } = req.params;
    if (!recommendationId) return res.status(400).json({ error: 'recommendationId is required' });

    const feedback = await RecommendationEffectiveness.findOne({
      recommendation: recommendationId,
      user: userId
    }).lean();

    return res.json({ feedback: feedback || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};