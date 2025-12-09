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
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import InsightsIcon from '@mui/icons-material/Insights';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sufficient: '#fbbf24',
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
  (label) => `${smartLabel(label, '')} didn't feel uplifting this time.`,
  (label) => `After ${smartLabel(label, '!')}, mood was lower.`
];
const NEUTRAL_VARIANTS = [
  (label) => `${smartLabel(label, '')} had a neutral effect.`,
  (label) => `No big mood change after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} kept things steady.`,
  (label) => `Mood stayed similar after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} didn't shift mood much.`
];

const formatText = (text) =>
  text ? text.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

const getMoodMessage = (activity, moodScore, idx = 0) => {
  const label = ACTIVITY_LABELS[activity] || formatText(activity);
  const variants = moodScore > 0 ? POSITIVE_VARIANTS : moodScore < 0 ? NEGATIVE_VARIANTS : NEUTRAL_VARIANTS;
  return variants[idx % variants.length](label);
};

const getMoodIcon = (score) => {
  if (score > 0) return <TrendingUpIcon style={{ color: POSITIVE_COLOR, fontSize: 22 }} />;
  if (score < 0) return <TrendingDownIcon style={{ color: NEGATIVE_COLOR, fontSize: 22 }} />;
  return <TrendingFlatIcon style={{ color: '#fbbf24', fontSize: 22 }} />;
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
  return local.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });
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
    <div className="mb-5">
      <button
        className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl border-2 border-[#55AD9B]/30 bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] hover:from-[#E6F4EF] hover:to-[#D8EFD3] transition-all duration-300 w-full text-left shadow-sm hover:shadow-md"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <AutoGraphIcon style={{ color: '#55AD9B', fontSize: 24 }} />
          <span className="font-bold text-lg text-[#1b5f52]">Daily Activity Comparison</span>
        </div>
        {open ? <ExpandLessIcon style={{ color: '#55AD9B' }} /> : <ExpandMoreIcon style={{ color: '#55AD9B' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-5 py-4 space-y-3 text-sm bg-white/50 rounded-xl border border-[#D8EFD3]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#55AD9B]/10 text-[#1b5f52] font-semibold text-lg">
                  F-score: {showValue(f)}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#fbbf24]/10 text-[#92400e] font-semibold text-lg">
                  p-value: {showValue(p)}
                </span>
              </div>
              <p className="text-[#272829] leading-relaxed text-lg">{getFScoreExplanation(f, p)}</p>
              <p className="text-mg text-[#6b7280] ">More logs = clearer differences. Keep tracking!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActivityComparisons = ({ tukeyHSD, groupMeans, groupCounts, includedSet }) => {
  const [open, setOpen] = useState(false);
  if (!tukeyHSD || tukeyHSD.length === 0 || !groupMeans) return null;

  const validGroups = Array.from(includedSet || []);
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
        className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl border-2 border-[#55AD9B]/30 bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] hover:from-[#E6F4EF] hover:to-[#D8EFD3] transition-all duration-300 w-full text-left shadow-sm hover:shadow-md"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <InsightsIcon style={{ color: '#55AD9B', fontSize: 24 }} />
          <span className="font-bold text-lg text-[#1b5f52]">Activity Differences</span>
        </div>
        {open ? <ExpandLessIcon style={{ color: '#55AD9B' }} /> : <ExpandMoreIcon style={{ color: '#55AD9B' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4 px-2">
              {chain.length > 0 && (
                <div className="bg-white/50 rounded-xl border border-[#D8EFD3] p-4">
                  <div className="font-semibold text-lg text-[#1b5f52] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
                    Ranked chain (adjacent significant):
                  </div>
                  {chain.map((c, i) => (
                    <div key={i} className="text-xs bg-gradient-to-r from-white to-[#F7FBF9] border border-[#E6F4EA] rounded-lg px-4 py-3 mb-2 flex justify-between items-center hover:shadow-sm transition">
                      <span className="text-[#272829]">{c.sentence}</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-full bg-[#55AD9B]/10 text-[#1b5f52] font-semibold text-lg">Δ {c.delta}</span>
                        <span className="px-2 py-1 rounded-full bg-[#fbbf24]/10 text-[#92400e] font-semibold text-lg">p {c.p}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {significantPairs.length > 0 ? (
                <div className="bg-white/50 rounded-xl border border-[#D8EFD3] p-4">
                  <div className="font-semibold text-lg text-[#1b5f52] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
                    Clear differences (≥2 logs each):
                  </div>
                  {significantPairs.map((row, idx) => {
                    const m1 = groupMeans[row.group1];
                    const m2 = groupMeans[row.group2];
                    const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
                    const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
                    const diffVal = Math.abs(m1 - m2).toFixed(2);
                    return (
                      <div
                        key={idx}
                        className="flex flex-col md:flex-row md:items-center gap-3 bg-gradient-to-r from-[#F1F8E8] to-[#F7FBF9] border border-[#95D2B3] rounded-xl px-4 py-3 mb-2 hover:shadow-md transition"
                      >
                        <div className="text-sm flex-1 text-[#272829]">
                          {explainPair(row)}
                          <span className="block text-xs text-[#6b7280] mt-1">
                            {a1}: {fmt(m1)} | {a2}: {fmt(m2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg px-3 py-1 rounded-full bg-[#55AD9B] text-white font-semibold shadow-sm">
                            Δ: {diffVal}
                          </span>
                          <span className="text-lg px-3 py-1 rounded-full bg-[#fbbf24] text-white font-semibold shadow-sm">
                            p: {row.p_adj}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-lg text-[#6b7280] bg-white/50 border border-[#E6F4EA] rounded-xl px-4 py-3">
                  No clear differences between activities with ≥2 logs.
                </div>
              )}

              {nonSignificantPairs.length > 0 && significantPairs.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-xs text-[#6b7280] mb-2">Other similar pairs:</div>
                  <div className="flex flex-wrap gap-2">
                    {nonSignificantPairs.slice(0, 8).map((row, idx) => {
                      const a1 = ACTIVITY_LABELS[row.group1] || formatText(row.group1);
                      const a2 = ACTIVITY_LABELS[row.group2] || formatText(row.group2);
                      return (
                        <div
                          key={idx}
                          className="text-xs bg-white border border-[#E6F4EA] rounded-lg px-3 py-1.5 shadow-sm hover:shadow transition"
                        >
                          {a1} & {a2}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="text-mg text-[#6b7280] pt-2 border-t border-[#E6F4EA]">
                Comparisons exclude activities with fewer than 2 logs for reliability.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Moods & Habits Analysis Info"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 border-2 border-[#D8EFD3]"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#1b5f52] flex items-center gap-2">
            <InfoOutlinedIcon style={{ color: '#55AD9B' }} />
            How Moods & Habits Analysis Works
          </h3>
          <button
            className="p-2 rounded-full hover:bg-[#F7FBF9] transition"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon style={{ color: '#272829' }} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#272829]">
          <div className="bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] rounded-xl p-4 border border-[#D8EFD3]">
            <span className="font-semibold text-[#1b5f52] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
              Mood score per log
            </span>
            <div className="text-[#555] leading-relaxed">
              Each time you log a habit, we look at how your mood changed before and after.
              If your mood went up, the score is positive. If it went down, the score is negative.
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] rounded-xl p-4 border border-[#D8EFD3]">
            <span className="font-semibold text-[#1b5f52] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
              Activity averages
            </span>
            <div className="text-[#555] leading-relaxed">
              For each activity (like "Reading" or "Gaming"), we average your mood scores for the day.
              Activities with at least two logs are compared to keep things fair and steady.
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] rounded-xl p-4 border border-[#D8EFD3]">
            <span className="font-semibold text-[#1b5f52] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
              ANOVA (Are activities different?)
            </span>
            <div className="text-[#555] leading-relaxed">
              ANOVA is a check to see whether some activities affect mood differently than others.
              The F-score tells us how strong the differences look. The p-value tells us how confident we
              are about those differences (small p-value, like below 0.05, means we're more confident).
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] rounded-xl p-4 border border-[#D8EFD3]">
            <span className="font-semibold text-[#1b5f52] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
              Tukey HSD (Which pairs are different?)
            </span>
            <div className="text-[#555] leading-relaxed">
              If ANOVA says "yes, there are differences," Tukey HSD looks at pairs of activities to see
              exactly which ones are different. We show the average mood score for each activity and a p-value
              to indicate how confident we are about the difference for that pair.
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-xl p-4 border-2 border-[#fbbf24] md:col-span-2">
            <span className="font-semibold text-[#92400e] flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>
              Best results tip
            </span>
            <div className="text-[#78350f] leading-relaxed">
              This works best when you log mood and habits consistently throughout the day and repeat the same
              activities. More logs per activity = clearer and more helpful results.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white font-semibold hover:shadow-lg transition-all duration-300"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DailyAnova = () => {
  const [results, setResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [sleepHours, setSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [sleepMoodScoreId, setSleepMoodScoreId] = useState(null);
  const [date, setDate] = useState(() => toLocalISODate());
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
          { date },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache'
            },
            params: { t: Date.now() }
          }
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

  const headerBg = {
    sleep: 'from-[#7DD3C0] via-[#55AD9B] to-[#3e8e7e]',
    activity: 'from-[#7DD3C0] via-[#55AD9B] to-[#3e8e7e]',
    social: 'from-[#7DD3C0] via-[#55AD9B] to-[#3e8e7e]',
    health: 'from-[#7DD3C0] via-[#55AD9B] to-[#3e8e7e]'
  };

  function renderCategoryResults(category, data) {
    if (!data || data.insufficient) {
      return (
        <div className="flex items-center justify-center h-full w-full py-12">
          <div className="text-center">
            <span className="text-[#6b7280] text-lg">
              {data && data.message ? data.message : 'No data for this category'}
            </span>
          </div>
        </div>
      );
    }

    const groupMeans = data.groupMeans || {};
    const groupCounts = data.groupCounts || {};
    const hasMinTwo = (a) => (groupCounts[a] ?? 0) >= 2;

    const rawIncluded = Array.isArray(data.includedGroups) ? data.includedGroups : [];
    const includedSet = new Set(rawIncluded.filter(hasMinTwo));
    if (includedSet.size === 0) {
      Object.keys(groupCounts).forEach(g => { if (hasMinTwo(g)) includedSet.add(g); });
    }

    const entries = Object.entries(groupMeans).filter(
      ([g, mean]) => includedSet.has(g) && typeof mean === 'number' && !isNaN(mean)
    );
    const positivesComputed = entries.filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
    const negativesComputed = entries.filter(([, m]) => m < 0).sort((a, b) => a[1] - b[1]);

    const topPositiveRaw = Array.isArray(data.topPositive) && data.topPositive.length > 0
      ? data.topPositive
      : positivesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));
    const topNegativeRaw = Array.isArray(data.topNegative) && data.topNegative.length > 0
      ? data.topNegative
      : negativesComputed.map(([activity, mean]) => ({ activity, moodScore: mean }));

    const topPositive = topPositiveRaw.filter(r => includedSet.has(r.activity));
    const topNegative = topNegativeRaw.filter(r => includedSet.has(r.activity));

    const includedGroups = Array.from(includedSet);
    const notEnoughGroups = Array.isArray(data.ignoredGroups) && data.ignoredGroups.length > 0
      ? data.ignoredGroups
      : Object.keys(groupCounts).filter(g => !includedSet.has(g));

    return (
      <>
        <FScoreAccordion f={data.F_value} p={data.p_value} />
        {(includedGroups.length > 0 || notEnoughGroups.length > 0) && (
          <div className="mb-4 text-lg text-[#6b7280] bg-white/40 rounded-lg px-4 py-3 border border-[#E6F4EA]">
            {includedGroups.length > 0 && (
              <div className="mb-1">
                <b className="text-[#1b5f52]">Activities considered:</b>{' '}
                {includedGroups.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
              </div>
            )}
            {notEnoughGroups.length > 0 && (
              <div>
                <b className="text-[#92400e]">Not enough logs:</b>{' '}
                {notEnoughGroups.map(g => ACTIVITY_LABELS[g] || formatText(g)).join(', ')}
              </div>
            )}
          </div>
        )}
        <ActivityComparisons
          tukeyHSD={data.tukeyHSD}
          groupMeans={groupMeans}
          groupCounts={groupCounts}
          includedSet={includedSet}
        />

        <div className="text-md text-[#6b7280] mb-5 bg-[#FEF3C7]/30 rounded-lg px-4 py-2 border border-[#fbbf24]/30">
           Lists show average mood change per activity (only if ≥2 logs).
        </div>

        {topPositive.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUpIcon style={{ color: POSITIVE_COLOR, fontSize: 26 }} />
              <span className="font-bold text-lg" style={{ color: POSITIVE_COLOR }}>
                Habits that boosted your mood
              </span>
            </div>
            {topPositive.map((row, idx) => (
              <motion.div
                key={row.activity}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 bg-gradient-to-r from-white to-[#F7FBF9] backdrop-blur border-2 rounded-xl px-5 py-4 mb-3 shadow-sm hover:shadow-md transition-all duration-300"
                style={{ borderColor: POSITIVE_COLOR, minHeight: 70 }}
              >
                <span className="flex-shrink-0">{getMoodIcon(row.moodScore)}</span>
                <span className="text-lg text-[#272829] flex-1 leading-relaxed">
                  {getMoodMessage(row.activity, row.moodScore, idx)}
                </span>
                <span className="text-md font-semibold px-3 py-1 rounded-full bg-[#55AD9B]/10 text-[#1b5f52]">
                  avg {typeof row.moodScore === 'number' ? row.moodScore.toFixed(2) : row.moodScore}
                </span>
                {data?.groupLastIds?.[row.activity] && (
                  <button
                    className="ml-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white text-md font-semibold hover:shadow-lg transition-all duration-300"
                    onClick={() => navigate(`/recommendation/${data.groupLastIds[row.activity]}`)}
                    aria-label={`View recommendation for ${row.activity}`}
                  >
                    View Tips
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {topNegative.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDownIcon style={{ color: NEGATIVE_COLOR, fontSize: 26 }} />
              <span className="font-bold text-lg" style={{ color: NEGATIVE_COLOR }}>
                Habits that lowered your mood
              </span>
            </div>
            {topNegative.map((row, idx) => (
              <motion.div
                key={row.activity}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 bg-gradient-to-r from-white to-[#FFF7ED] backdrop-blur border-2 rounded-xl px-5 py-4 mb-3 shadow-sm hover:shadow-md transition-all duration-300"
                style={{ borderColor: NEGATIVE_COLOR, minHeight: 70 }}
              >
                <span className="flex-shrink-0">{getMoodIcon(row.moodScore)}</span>
                <span className="text-lg text-[#272829] flex-1 leading-relaxed">
                  {getMoodMessage(row.activity, row.moodScore, idx)}
                </span>
                <span className="text-md font-semibold px-3 py-1 rounded-full bg-[#FF9800]/10 text-[#92400e]">
                  avg {typeof row.moodScore === 'number' ? row.moodScore.toFixed(2) : row.moodScore}
                </span>
                {data?.groupLastIds?.[row.activity] && (
                  <button
                    className="ml-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF9800] to-[#e07f00] text-white text-xs font-semibold hover:shadow-lg transition-all duration-300"
                    onClick={() => navigate(`/recommendation/${data.groupLastIds[row.activity]}`)}
                    aria-label={`View recommendation for ${row.activity}`}
                  >
                    View Tips
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#F7FBF9] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-8 border-b-2 border-[#CBE7DC] bg-gradient-to-r from-white/50 to-[#F7FBF9]/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-full hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-[#1b5f52] text-2xl font-bold tracking-wide mb-2">
              Daily Moods & Habits Analysis
            </div>
            <div className="flex justify-center items-center gap-4 mt-3">
              <button
                onClick={handlePrev}
                className="p-2.5 rounded-full bg-white hover:bg-[#F7FBF9] shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Previous Day"
              >
                <ArrowBackIosNewIcon style={{ color: '#55AD9B', fontSize: 20 }} />
              </button>
              <span className="px-6 py-2 rounded-full bg-white shadow-md text-[#1b5f52] font-bold text-base border-2 border-[#D8EFD3]">
                {date === toLocalISODate() ? 'Today' : formatMonthDayYear(date)}
              </span>
              <button
                onClick={handleNext}
                className="p-2.5 rounded-full bg-white hover:bg-[#F7FBF9] shadow-md hover:shadow-lg transition-all duration-300"
                aria-label="Next Day"
                disabled={date >= toLocalISODate()}
                style={{ opacity: date >= toLocalISODate() ? 0.4 : 1, cursor: date >= toLocalISODate() ? 'not-allowed' : 'pointer' }}
              >
                <ArrowForwardIosIcon style={{ color: '#55AD9B', fontSize: 20 }} />
              </button>
            </div>
          </div>
          <div className="w-[52px]"></div>
        </div>
      </div>

      {/* Info button */}
      <div className="max-w-6xl mx-auto px-6 mt-6 flex justify-center">
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#55AD9B] bg-white hover:bg-[#F7FBF9] shadow-md hover:shadow-lg transition-all duration-300"
          onClick={() => setShowInfo(true)}
          aria-label="How analysis works"
        >
          <InfoOutlinedIcon style={{ color: '#55AD9B', fontSize: 22 }} />
          <span className="text-mg text-[#1b5f52] font-semibold">How this analysis works</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#D8EFD3] border-t-[#55AD9B] rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-xl text-[#1b5f52] font-semibold">Analyzing your day...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                key: 'sleep',
                title: 'Sleep',
                icon: CATEGORY_ICONS.sleep,
                header: 'How your sleep affected your mood',
                content: (
                  <div className="flex flex-col justify-center items-center h-full w-full py-4">
                    <div className="w-full max-w-xl mx-auto">
                      {sleepQuality && sleepHours ? (
                        <div className="flex flex-col items-center justify-center w-full">
                          {sleepMoodScore !== null && (
                            <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="flex flex-col items-center bg-gradient-to-br from-white to-[#F7FBF9] backdrop-blur border-2 rounded-2xl px-6 py-6 w-full shadow-md hover:shadow-xl transition-all duration-300"
                              style={{
                                borderColor:
                                  sleepMoodScore > 0
                                    ? POSITIVE_COLOR
                                    : sleepMoodScore < 0
                                    ? NEGATIVE_COLOR
                                    : '#fbbf24',
                                minHeight: 140
                              }}
                            >
                              <span
                                className="px-5 py-2 rounded-full font-bold text-lg mb-4 shadow-md"
                                style={{
                                  backgroundColor: sleepQualityColors[sleepQuality],
                                  color: '#fff'
                                }}
                              >
                                {formatText(sleepQuality)} Sleep
                              </span>
                              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                                <span className="flex-shrink-0">{getMoodIcon(sleepMoodScore)}</span>
                                <span className="text-lg text-[#272829] flex-1 text-center leading-relaxed">
                                  {getSleepMessage(sleepHours, sleepMoodScore)}
                                </span>
                              </div>
                              {sleepMoodScoreId && (
                                <button
                                  className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                                  onClick={() => navigate(`/recommendation/${sleepMoodScoreId}`)}
                                >
                                  View Sleep Tips
                                </button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-48 w-full">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7FBF9] flex items-center justify-center border-2 border-[#D8EFD3]">
                              <span className="text-3xl">💤</span>
                            </div>
                            <span className="text-[#6b7280] text-base font-medium">
                              No sleep data recorded
                            </span>
                          </div>
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className="rounded-2xl shadow-lg border-2 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${headerBg[cat.key]} shadow-md`}>
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    <h2 className="text-2xl font-bold text-white drop-shadow">{cat.title}</h2>
                  </div>
                  <div className="text-white/95 mt-1.5 font-medium">{cat.header}</div>
                </div>
                <div className="p-6">{cat.content}</div>
              </motion.div>
            ))}
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center bg-gradient-to-r from-[#D8EFD3] to-[#95D2B3] rounded-2xl p-6 mt-10 shadow-lg border-2 border-[#55AD9B]/30"
        >
          <p className="text-[#1b5f52] text-lg font-bold">
             Each log teaches what lifts you. Keep going! 
          </p>
        </motion.div>
      </div>

      {/* Info modal */}
      <AnimatePresence>
        {showInfo && <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default DailyAnova;