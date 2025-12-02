import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CATEGORY_ICONS = {
  sleep: <BedtimeIcon style={{ fontSize: 32, color: '#55AD9B' }} />,
  activity: <EmojiEventsIcon style={{ fontSize: 32, color: '#55AD9B' }} />,
  social: <PeopleIcon style={{ fontSize: 32, color: '#55AD9B' }} />,
  health: <FavoriteIcon style={{ fontSize: 32, color: '#55AD9B' }} />,
};

const ACTIVITY_LABELS = {
  commute: 'Commuting',
  exam: 'Having an exam',
  homework: 'Doing your homework',
  study: 'Studying',
  project: 'Doing a project',
  read: 'Reading',
  extracurricular: 'Doing an extracurricular activity',
  'household-chores': 'Doing household chores',
  relax: 'Relaxing',
  'watch-movie': 'Watching a movie',
  'listen-music': 'Listening to music',
  gaming: 'Gaming',
  'browse-internet': 'Browsing the internet',
  shopping: 'Shopping',
  travel: 'Traveling',
  alone: 'Being alone',
  friends: 'Socializing with your friends',
  family: 'Socializing with your family',
  classmates: 'Socializing with your classmates',
  relationship: 'Socializing with your significant other',
  online: 'Socializing online',
  pet: 'Being with your pet',
  jog: 'Jogging',
  walk: 'Walking',
  exercise: 'Exercising',
  sports: 'Playing a sport',
  meditate: 'Meditating',
  'eat-unhealthy': 'Eating unhealthy food',
  'eat-healthy': 'Eating healthy food',
  'no-physical': 'Not doing any physical activity',
  'drink-alcohol': 'Drinking alcohol'
};

const CATEGORY_LABELS = {
  activity: 'Overall Activities',
  social: 'Social',
  health: 'Health',
  sleep: 'Sleep'
};

const sleepQualityColors = {
  Poor: '#ff6b6b',
  Sufficient: '#f7b801',
  Good: '#55AD9B'
};

const POSITIVE_COLOR = '#55AD9B';
const NEGATIVE_COLOR = '#FF9800';

function smartLabel(label, prev = '') {
  if (!label) return '';
  if (!prev || /[.!]\s*$/.test(prev)) return label.charAt(0).toUpperCase() + label.slice(1);
  return label.charAt(0).toLowerCase() + label.slice(1);
}

const POSITIVE_VARIANTS = [
  (label) => `${smartLabel(label, '')} boosted your mood.`,
  (label) => `Great job! ${smartLabel(label, '!')} helped you feel better.`,
  (label) => `You felt better after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} made a positive difference.`,
  (label) => `${smartLabel(label, '')} was supportive today.`
];
const NEGATIVE_VARIANTS = [
  (label) => `${smartLabel(label, '')} lowered your mood.`,
  (label) => `Mood dipped after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} had a negative impact today.`,
  (label) => `${smartLabel(label, '')} didn’t feel uplifting this time.`,
  (label) => `After ${smartLabel(label, '!')}, mood was lower.`
];
const NEUTRAL_VARIANTS = [
  (label) => `${smartLabel(label, '')} had a neutral effect.`,
  (label) => `No big mood change after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} kept things steady.`,
  (label) => `Mood stayed similar after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} didn’t shift mood much.`
];

const formatText = (text) =>
  text ? text.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

const getMoodMessage = (activity, moodScore, idx = 0) => {
  const label = ACTIVITY_LABELS[activity] || formatText(activity);
  const variants = moodScore > 0 ? POSITIVE_VARIANTS : moodScore < 0 ? NEGATIVE_VARIANTS : NEUTRAL_VARIANTS;
  return variants[idx % variants.length](label);
};

const getMoodIcon = (score) => {
  if (score > 0) return <TrendingUpIcon style={{ color: POSITIVE_COLOR, fontSize: 20 }} />;
  if (score < 0) return <TrendingDownIcon style={{ color: NEGATIVE_COLOR, fontSize: 20 }} />;
  return <TrendingFlatIcon style={{ color: '#f7b801', fontSize: 20 }} />;
};

const getSleepMessage = (hours, moodScore) => {
  const absScore = Math.abs(moodScore);
  let intensity;
  if (absScore >= 40) intensity = 'strong';
  else if (absScore >= 20) intensity = 'moderate';
  else if (absScore > 0) intensity = 'slight';
  if (moodScore > 0) return `Sleeping for ${hours} hours had a ${intensity} positive effect on your mood.`;
  if (moodScore < 0) return `${hours} hours of sleep lowered your mood (${intensity} effect).`;
  return `Your sleep had a neutral effect today.`;
};

const toLocalISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; 
};
const addDaysLocal = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toLocalISODate(dt);
};
const formatMonthDayYear = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' }); // e.g., December 01, 2025
};

const getFScoreExplanation = (f, p) => {
  if (p == null || f == null || f === 0) return 'Not enough data today to compare activities.';
  if (p < 0.05) return 'Some activities affected your mood differently today.';
  return 'Activities had similar effects on your mood today.';
};

const FScoreAccordion = ({ f, p }) => {
  const [open, setOpen] = useState(false);
  const showValue = (v) => (v == null || v === 0 ? '—' : v);
  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#55AD9B] bg-[#F7FBF9] hover:bg-[#E6F4EF] transition w-full text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-bold text-[#55AD9B]">Daily Activity Comparison</span>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </button>
      {open && (
        <div className="mt-2 px-2 space-y-2 text-sm">
          <div>
            <span className="font-semibold text-[#55AD9B]">F-score:</span> {showValue(f)} &nbsp;
            <span className="font-semibold text-[#f7b801]">p-value:</span> {showValue(p)}
          </div>
          <div className="text-[#272829]">{getFScoreExplanation(f, p)}</div>
          <div className="text-xs text-[#777]">More logs = clearer differences. Keep tracking.</div>
        </div>
      )}
    </div>
  );
};

const ActivityComparisons = ({ tukeyHSD, groupMeans, groupCounts }) => {
  const [open, setOpen] = useState(false);
  if (!tukeyHSD || tukeyHSD.length === 0 || !groupMeans) return null;

  const validGroups = Object.keys(groupCounts || {}).filter(g => groupCounts[g] >= 2);
  const filteredPairs = tukeyHSD.filter(r => validGroups.includes(r.group1) && validGroups.includes(r.group2));
  if (filteredPairs.length === 0) return null;

  const significantPairs = filteredPairs.filter(r => r.reject);
  const nonSignificantPairs = filteredPairs.filter(r => !r.reject);
  const fmt = v => (typeof v === 'number' && !isNaN(v) ? v.toFixed(2) : 'n/a');

  const ranked = [...validGroups]
    .filter(g => typeof groupMeans[g] === 'number' && !isNaN(groupMeans[g]))
    .sort((a, b) => groupMeans[b] - groupMeans[a]);

  const sigMap = new Map();
  significantPairs.forEach(r => {
    sigMap.set(`${r.group1}||${r.group2}`, r);
    sigMap.set(`${r.group2}||${r.group1}`, r);
  });

  const chain = [];
  for (let i = 0; i < ranked.length - 1; i++) {
    const g1 = ranked[i];
    const g2 = ranked[i + 1];
    const row = sigMap.get(`${g1}||${g2}`);
    if (!row) continue;
    const m1 = groupMeans[g1];
    const m2 = groupMeans[g2];
    const label1 = ACTIVITY_LABELS[g1] || formatText(g1);
    const label2 = ACTIVITY_LABELS[g2] || formatText(g2);
    const sentence = m1 === m2
      ? `Similar: ${label1} & ${label2}`
      : (m1 > m2
          ? `${label1} improved mood more than ${label2}`
          : `${label2} improved mood more than ${label1}`);
    chain.push({
      g1, g2, m1, m2,
      p: row.p_adj,
      sentence,
      delta: Math.abs(m1 - m2).toFixed(2)
    });
    if (chain.length === 3) break;
  }

  const explainPair = (row) => {
    const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
    const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
    const m1 = groupMeans[row.group1];
    const m2 = groupMeans[row.group2];
    if (typeof m1 !== 'number' || typeof m2 !== 'number') return `${a1} vs ${a2} (limited data).`;

    const diff = m1 - m2;
    const bothNeg = m1 < 0 && m2 < 0;
    const bothPos = m1 > 0 && m2 > 0;
    const equal = Number(m1.toFixed(2)) === Number(m2.toFixed(2));

    if (!row.reject || equal) return `Similar effect: ${a1} & ${a2}.`;

    if (diff > 0) {
      if (bothNeg) return `${a1} lowered mood less than ${a2}.`;
      if (bothPos) return `${a1} lifted mood more than ${a2}.`;
      if (m1 > 0 && m2 < 0) return `${a1} lifted mood while ${a2} lowered it.`;
      if (m1 < 0 && m2 > 0) return `${a2} lifted mood while ${a1} lowered it.`;
      return `${a1} had a higher average mood than ${a2}.`;
    } else {
      if (bothNeg) return `${a2} lowered mood less than ${a1}.`;
      if (bothPos) return `${a2} lifted mood more than ${a1}.`;
      if (m2 > 0 && m1 < 0) return `${a2} lifted mood while ${a1} lowered it.`;
      if (m2 < 0 && m1 > 0) return `${a1} lifted mood while ${m2} lowered it.`;
      return `${a2} had a higher average mood than ${a1}.`;
    }
  };

  return (
    <div className="mb-6">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#55AD9B] bg-[#F7FBF9] hover:bg-[#E6F4EF] transition w-full text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-bold text-[#55AD9B]">Activity Differences</span>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {chain.length > 0 && (
            <div>
              <div className="font-semibold text-sm text-[#55AD9B] mb-2">Ranked chain (adjacent significant):</div>
              {chain.map((c, i) => (
                <div key={i} className="text-xs bg-white border border-[#D8EFD3] rounded-lg px-3 py-2 mb-1 flex justify-between items-center">
                  <span>{c.sentence}</span>
                  <span className="text-[#555]">Δ {c.delta}, p {c.p}</span>
                </div>
              ))}
            </div>
          )}
          {significantPairs.length > 0 ? (
            <div>
              <div className="font-semibold text-sm text-[#55AD9B] mb-2">Clear differences (≥2 logs each):</div>
              {significantPairs.map((row, idx) => {
                const m1 = groupMeans[row.group1];
                const m2 = groupMeans[row.group2];
                const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
                const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
                const diffVal = Math.abs(m1 - m2).toFixed(2);
                return (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center gap-3 bg-[#F1F8E8] border border-[#95D2B3] rounded-xl px-4 py-3 mb-2"
                  >
                    <div className="text-sm flex-1 text-[#272829]">
                      {explainPair(row)}
                      <span className="block text-xs text-[#555] mt-1">
                        {a1}: {fmt(m1)} | {a2}: {fmt(m2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#55AD9B] text-white font-semibold">
                        Δ: {diffVal}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#f7b801] text-white font-semibold">
                        p: {row.p_adj}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-[#555] bg-[#F7FBF9] border border-[#D8EFD3] rounded-xl px-4 py-3">
              No clear differences between activities with ≥2 logs.
            </div>
          )}

          {nonSignificantPairs.length > 0 && significantPairs.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold text-sm text-[#777] mb-1">Other similar pairs:</div>
              <div className="flex flex-wrap gap-3">
                {nonSignificantPairs.slice(0, 8).map((row, idx) => {
                  const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
                  const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
                  return (
                    <div
                      key={idx}
                      className="text-xs bg-white border border-[#EEE] rounded-lg px-3 py-1 shadow-sm"
                    >
                      {a1} & {a2}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="text-xs text-[#777]">
            Comparisons exclude activities with fewer than 2 logs for reliability.
          </div>
        </div>
      )}
    </div>
  );
};

const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Moods & Habits Analysis Info"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-[92%] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-[#272829]">How Moods & Habits Analysis Works</h3>
          <button
            className="p-2 rounded-full hover:bg-[#F7FBF9]"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon style={{ color: '#272829' }} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-[#272829]">
          <div>
            <span className="font-semibold text-[#55AD9B]">Mood score per log</span>
            <div className="mt-1 text-[#555]">
              Each time you log a habit, we look at how your mood changed before and after.
              If your mood went up, the score is positive. If it went down, the score is negative.
            </div>
          </div>

          <div>
            <span className="font-semibold text-[#55AD9B]">Activity averages</span>
            <div className="mt-1 text-[#555]">
              For each activity (like “Reading” or “Gaming”), we average your mood scores for the day.
              Activities with at least two logs are compared to keep things fair and steady.
            </div>
          </div>

          <div>
            <span className="font-semibold text-[#55AD9B]">ANOVA (Are activities different?)</span>
            <div className="mt-1 text-[#555]">
              ANOVA is a check to see whether some activities affect mood differently than others.
              The F-score tells us how strong the differences look. The p-value tells us how confident we
              are about those differences (small p-value, like below 0.05, means we’re more confident).
            </div>
          </div>

          <div>
            <span className="font-semibold text-[#55AD9B]">Tukey HSD (Which pairs are different?)</span>
            <div className="mt-1 text-[#555]">
              If ANOVA says “yes, there are differences,” Tukey HSD looks at pairs of activities to see
              exactly which ones are different. We show the average mood score for each activity and a p-value
              to indicate how confident we are about the difference for that pair.
            </div>
          </div>

          <div>
            <span className="font-semibold text-[#55AD9B]">Best results tip</span>
            <div className="mt-1 text-[#555]">
              This works best when you log mood and habits consistently throughout the day and repeat the same
              activities. More logs per activity = clearer and more helpful results.
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            className="px-4 py-2 rounded-full bg-[#55AD9B] text-white font-semibold hover:bg-[#3e8e7e] transition"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const DailyAnova = () => {
  const [results, setResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [sleepHours, setSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [sleepMoodScoreId, setSleepMoodScoreId] = useState(null);
  const [date, setDate] = useState(() => toLocalISODate()); // YYYY-MM-DD for backend
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnova = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/anova/run`,
          { date }, // backend expects YYYY-MM-DD
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(res.data.anovaResults || {});
        if (res.data.sleep) {
          setSleepQuality(res.data.sleep.quality);
          setSleepHours(res.data.sleep.hours);
          setSleepMoodScore(res.data.sleep.moodScore);
          setSleepMoodScoreId(res.data.sleep._id);
        } else {
          setSleepQuality(null);
          setSleepHours(null);
          setSleepMoodScore(null);
          setSleepMoodScoreId(null);
        }
      } catch (error) {
        console.error('Error fetching daily analysis:', error);
      }
      setLoading(false);
    };
    fetchAnova();
  }, [date]);

  const handlePrev = () => setDate(addDaysLocal(date, -1));
  const handleNext = () => setDate(addDaysLocal(date, 1));
  const getDayLabel = () => {
    const today = toLocalISODate();
    if (date === today) return 'Today';
    return formatMonthDayYear(date);
  };

  const headerBg = {
    sleep: 'from-[#A7D7C5] to-[#55AD9B]',
    activity: 'from-[#A7D7C5] to-[#55AD9B]',
    social: 'from-[#A7D7C5] to-[#55AD9B]',
    health: 'from-[#A7D7C5] to-[#55AD9B]'
  };

  function renderCategoryResults(category, data) {
    if (!data || data.insufficient) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <span className="text-gray-500 text-lg text-center">
            {data && data.message ? data.message : 'No data for this category'}
          </span>
        </div>
      );
    }

    const groupMeans = data.groupMeans || {};
    const groupCounts = data.groupCounts || {};

    const entries = Object.entries(groupMeans).filter(([g, mean]) =>
      typeof mean === 'number' && !isNaN(mean) && (groupCounts[g] ?? 0) >= 2
    );
    const positivesComputed = entries.filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
    const negativesComputed = entries.filter(([, m]) => m < 0).sort((a, b) => a[1] - b[1]);

    const topPositive = Array.isArray(data.topPositive) && data.topPositive.length > 0
      ? data.topPositive
      : positivesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));
    const topNegative = Array.isArray(data.topNegative) && data.topNegative.length > 0
      ? data.topNegative
      : negativesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));

    return (
      <>
        <FScoreAccordion f={data.F_value} p={data.p_value} />
        {data.includedGroups && data.includedGroups.length > 0 && (
          <div className="mb-3 text-xs text-[#555]">
            <b>Activities considered:</b> {data.includedGroups.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
            {data.ignoredGroups && data.ignoredGroups.length > 0 && (
              <> | <b>Not enough logs:</b> {data.ignoredGroups.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}</>
            )}
          </div>
        )}
        <ActivityComparisons tukeyHSD={data.tukeyHSD} groupMeans={groupMeans} groupCounts={groupCounts} />

        <div className="text-xs text-[#777] mb-4">
          Lists show average mood change per activity (only if ≥2 logs).
        </div>

        {topPositive.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon style={{ color: POSITIVE_COLOR }} />
              <span className="font-bold text-lg" style={{ color: POSITIVE_COLOR }}>
                Habits that boosted your mood
              </span>
            </div>
            {topPositive.map((row, idx) => (
              <div
                key={row.activity}
                className="flex items-center gap-3 bg-white/70 backdrop-blur border-2 rounded-xl px-5 py-4 mb-3 shadow-sm hover:shadow-md transition"
                style={{ borderColor: POSITIVE_COLOR, minHeight: 60 }}
              >
                <span className="flex-shrink-0">{getMoodIcon(row.moodScore)}</span>
                <span className="text-base text-[#272829] flex-1">
                  {getMoodMessage(row.activity, row.moodScore, idx)}
                </span>
                <span className="text-xs font-semibold text-[#55AD9B]">
                  avg {typeof row.moodScore === 'number' ? row.moodScore.toFixed(2) : row.moodScore}
                </span>
              </div>
            ))}
          </div>
        )}

        {topNegative.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDownIcon style={{ color: NEGATIVE_COLOR }} />
              <span className="font-bold text-lg" style={{ color: NEGATIVE_COLOR }}>
                Habits that lowered your mood
              </span>
            </div>
            {topNegative.map((row, idx) => (
              <div
                key={row.activity}
                className="flex items-center gap-3 bg-white/70 backdrop-blur border-2 rounded-xl px-5 py-4 mb-3 shadow-sm hover:shadow-md transition"
                style={{ borderColor: NEGATIVE_COLOR, minHeight: 60 }}
              >
                <span className="flex-shrink-0">{getMoodIcon(row.moodScore)}</span>
                <span className="text-base text-[#272829] flex-1">
                  {getMoodMessage(row.activity, row.moodScore, idx)}
                </span>
                <span className="text-xs font-semibold text-[#FF9800]">
                  avg {typeof row.moodScore === 'number' ? row.moodScore.toFixed(2) : row.moodScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#F7FBF9] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-10 border-b border-[#CBE7DC]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white/60 shadow-sm transition"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-[#5A6A66] text-lg tracking-wide">
              {date === toLocalISODate() ? 'Today' : formatMonthDayYear(date)}
            </div>
            <div className="flex justify-center items-center gap-3 mt-3">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full hover:bg-white/60 shadow-sm transition"
                aria-label="Previous Day"
              >
                <ArrowBackIosNewIcon style={{ color: '#55AD9B' }} />
              </button>
              <span className="px-4 py-1 rounded-full bg-white/70 shadow text-[#55AD9B] font-semibold">
                {formatMonthDayYear(date)}
              </span>
              <button
                onClick={handleNext}
                className="p-2 rounded-full hover:bg-white/60 shadow-sm transition"
                aria-label="Next Day"
                disabled={date >= toLocalISODate()}
                style={{ opacity: date >= toLocalISODate() ? 0.5 : 1 }}
              >
                <ArrowForwardIosIcon style={{ color: '#55AD9B' }} />
              </button>
            </div>
          </div>
          <div style={{ width: 40 }} />
        </div>
      </div>

      {/* Info button outside header, centered below it */}
      <div className="max-w-7xl mx-auto px-6 mt-6 flex justify-center">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#55AD9B] bg-white/70 backdrop-blur hover:bg-white shadow-sm hover:shadow-md transition"
          onClick={() => setShowInfo(true)}
          aria-label="How analysis works"
        >
          <InfoOutlinedIcon style={{ color: '#55AD9B' }} />
          <span className="text-sm text-[#55AD9B] font-semibold">How this analysis works</span>
        </button>
      </div>

      {/* Decorative divider */}
      <div className="max-w-5xl mx-auto mt-4 mb-2 px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#CBE7DC] to-transparent" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#D8EFD3] border-t-[#55AD9B] rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-xl text-[#55AD9B] font-semibold">Analyzing your day...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                key: 'sleep',
                title: 'Sleep',
                icon: CATEGORY_ICONS.sleep,
                header: 'How your sleep affected your mood',
                content: (
                  <div className="flex flex-col justify-center items-center h-full w-full">
                    <div className="w-full max-w-xl mx-auto">
                      {sleepQuality && sleepHours ? (
                        <div className="flex flex-col items-center justify-center w-full">
                          {sleepMoodScore !== null && (
                            <div
                              className="flex flex-col items-center bg-white/70 backdrop-blur border-2 rounded-2xl px-6 py-6 w-full shadow-sm hover:shadow-md transition"
                              style={{
                                borderColor:
                                  sleepMoodScore > 0
                                    ? POSITIVE_COLOR
                                    : sleepMoodScore < 0
                                    ? NEGATIVE_COLOR
                                    : '#f7b801',
                                minHeight: 120,
                                maxWidth: 640
                              }}
                            >
                              <span
                                className="px-4 py-1 rounded-full font-bold text-base mb-4 shadow-sm"
                                style={{
                                  backgroundColor: sleepQualityColors[sleepQuality],
                                  color: '#fff'
                                }}
                              >
                                {formatText(sleepQuality)}
                              </span>
                              <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                <span className="flex-shrink-0 mb-2 md:mb-0">{getMoodIcon(sleepMoodScore)}</span>
                                <span className="text-base text-[#272829] flex-1 text-center">
                                  {getSleepMessage(sleepHours, sleepMoodScore)}
                                </span>
                              </div>
                              {sleepMoodScoreId && (
                                <button
                                  className="mt-4 px-4 py-2 rounded-full bg-[#55AD9B] text-white font-semibold shadow hover:bg-[#3e8e7e] transition"
                                  onClick={() => navigate(`/recommendation/${sleepMoodScoreId}`)}
                                >
                                  View Recommendation
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-40 w-full">
                          <span className="text-gray-500 text-lg font-medium text-center">
                            No sleep data recorded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              ...['activity', 'social', 'health'].map(category => ({
                key: category,
                title: CATEGORY_LABELS[category],
                icon: CATEGORY_ICONS[category],
                header: `How your ${CATEGORY_LABELS[category].toLowerCase()} affected your mood`,
                content: renderCategoryResults(category, results[category])
              }))
            ].map((cat, idx) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl shadow-lg border bg-white/70 backdrop-blur"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${headerBg[cat.key]}`}>
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    <h2 className="text-2xl font-bold text-white">{cat.title}</h2>
                  </div>
                  <div className="text-white/90 mt-1">{cat.header}</div>
                </div>
                <div className="p-6">{cat.content}</div>
              </motion.div>
            ))}
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-gradient-to-r from-[#D8EFD3] to-[#95D2B3] rounded-2xl p-6 mt-10 shadow-sm"
        >
          <p className="text-[#272829] text-lg font-medium">
            🌟 Each log teaches what lifts you. Keep going! 🌟
          </p>
        </motion.div>
      </div>

      {/* Info modal */}
      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
};

export default DailyAnova;