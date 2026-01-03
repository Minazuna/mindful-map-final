const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataPath = path.join(__dirname, '..', 'utils', 'teacherRecommendations.json');
const TEACHER_RECOMMENDATIONS = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function stableOrder(items, keyStr) {
  return [...items].sort((a, b) => {
    const ha = crypto.createHash('sha256').update(keyStr + '|' + String(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(keyStr + '|' + String(b)).digest('hex');
    return parseInt(ha.slice(0, 8), 16) - parseInt(hb.slice(0, 8), 16);
  });
}

function topCategory(cat) {
  const c = String(cat || '').trim().toLowerCase();
  if (c === 'activity') return 'activity';
  if (c === 'social') return 'social';
  if (c === 'health') return 'health';
  if (['activity', 'social', 'health'].includes(cat)) return cat;
  return null;
}

function normActivity(a) {
  return String(a || '').trim().toLowerCase();
}

function uniqueTopN(list, n, keyStr) {
  const ordered = stableOrder(list, keyStr);
  const seen = new Set();
  const out = [];
  for (const r of ordered) {
    const t = String(r || '').trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === n) break;
  }
  return out;
}

function getTeacherRecommendations({ category, activity, moodType, n = 3 }) {
  const cat = topCategory(category);
  const act = normActivity(activity);
  const mood = String(moodType || '').trim().toLowerCase() === 'positive' ? 'positive' : 'negative';
  const keyStr = [cat || '', act || '', mood].join('|');

  if (!cat) return [];

  const recs = TEACHER_RECOMMENDATIONS[cat]?.[act]?.[mood] || [];
  return uniqueTopN(recs, n, keyStr);
}

module.exports = { getTeacherRecommendations };