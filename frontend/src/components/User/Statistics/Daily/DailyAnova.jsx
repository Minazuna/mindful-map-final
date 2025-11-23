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

const POSITIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} boosted your mood by ${score}%. Keep it up!`,
  (label, score) => `Great job! ${smartLabel(label, '!')} increased your mood by ${score}%.`,
  (label, score) => `Awesome! ${smartLabel(label, '!')} helped you feel ${score}% better.`,
  (label, score) => `You felt ${score}% better after ${smartLabel(label, 'r')}. Keep doing what works!`,
  (label, score) => `${smartLabel(label, '')} made a positive difference of ${score}% in your mood!`
];

const NEGATIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} lowered your mood by ${score}%. That's okay—tomorrow is a new day!`,
  (label, score) => `You felt ${score}% less upbeat after ${smartLabel(label, 'r')}. Remember, every day is a learning experience!`,
  (label, score) => `${smartLabel(label, '')} had a negative impact of ${score}% on your mood. Take care of yourself!`,
  (label, score) => `Not every activity lifts us up—${smartLabel(label, '—')} decreased your mood by ${score}%. You’ve got this!`,
  (label, score) => `After ${smartLabel(label, '!')}, your mood dropped by ${score}%. Be kind to yourself and try again!`
];

const NEUTRAL_VARIANTS = [
  (label) => `${smartLabel(label, '')} had a neutral effect on your mood.`,
  (label) => `No big mood changes after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} kept your mood steady.`,
  (label) => `Your mood stayed about the same after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} didn't change your mood much this time.`
];

function smartLabel(label, prev = '') {
  if (!label) return '';
  if (!prev || /[.!]\s*$/.test(prev)) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return label.charAt(0).toLowerCase() + label.slice(1);
}

const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getMoodMessage = (activity, moodScore, idx = 0) => {
  const absScore = Math.abs(moodScore);
  const label = ACTIVITY_LABELS[activity] || formatText(activity);

  let variants;
  if (moodScore > 0) {
    variants = POSITIVE_VARIANTS;
  } else if (moodScore < 0) {
    variants = NEGATIVE_VARIANTS;
  } else {
    variants = NEUTRAL_VARIANTS;
  }
  const variantIndex = idx % variants.length;
  return variants[variantIndex](label, absScore);
};

const getMoodIcon = (score) => {
  if (score > 0) return <TrendingUpIcon style={{ color: POSITIVE_COLOR, fontSize: 20 }} />;
  if (score < 0) return <TrendingDownIcon style={{ color: NEGATIVE_COLOR, fontSize: 20 }} />;
  return <TrendingFlatIcon style={{ color: '#f7b801', fontSize: 20 }} />;
};

const getSleepMessage = (hours, moodScore) => {
  const absScore = Math.abs(moodScore);
  if (moodScore > 0) {
    return `Sleeping for ${hours} hours improved your mood by ${absScore}%. Great job!`;
  } else if (moodScore < 0) {
    return `Having ${hours} hours of sleep lowered your mood by ${absScore}%. Try to get more restful sleep.`;
  } else {
    return `Your sleep had a neutral effect on your mood today.`;
  }
};

const getDateString = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const getFScoreExplanation = (f, p) => {
  if (p === null || p === undefined || f === null || f === undefined || p === 0 || f === 0) {
    return "Not available at the moment. There's not enough data to compare your activities today.";
  }
  if (p < 0.05) {
    return "Some activities affected your mood differently today. The F-score shows there's a real difference, not just random chance.";
  } else {
    return "Your activities had a similar effect on your mood today. The F-score shows there's no big difference between them.";
  }
};

const FScoreAccordion = ({ f, p }) => {
  const [open, setOpen] = useState(false);

  let showValue = (v) =>
    v === null || v === undefined || v === 0 ? 'Not available at the moment' : v;

  return (
    <div className="mb-4">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#55AD9B] bg-[#F7FBF9] hover:bg-[#E6F4EF] transition w-full text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-bold text-[#55AD9B]">F-score & p-value</span>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </button>
      {open && (
        <div className="mt-2 px-2">
          <div className="flex flex-wrap gap-4 items-center mb-2">
            <span className="font-semibold text-[#55AD9B]">
              F-score: <span className="font-normal">{showValue(f)}</span>
            </span>
            <span className="font-semibold text-[#f7b801]">
              p-value: <span className="font-normal">{showValue(p)}</span>
            </span>
          </div>
          <div className="text-[#272829] text-sm">
            {getFScoreExplanation(f, p)}
          </div>
          <div className="text-xs text-[#888] mt-2">
            <b>What does this mean?</b> <br />
            The F-score helps us see if your activities made a real difference in your mood today, or if things were about the same. If the F-score and p-value aren't available, it just means you need to log more activities for a proper comparison.
          </div>
        </div>
      )}
    </div>
  );
};

const TukeyHSDTable = ({ tukeyHSD }) => {
  const [open, setOpen] = useState(false);

  if (!tukeyHSD || tukeyHSD.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#55AD9B] bg-[#F7FBF9] hover:bg-[#E6F4EF] transition w-full text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-bold text-[#55AD9B]">Tukey HSD: Activity Pair Differences</span>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </button>
      {open && (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-sm border border-[#D8EFD3] rounded-xl">
            <thead>
              <tr className="bg-[#F7FBF9]">
                <th className="px-3 py-2 border">Activity 1</th>
                <th className="px-3 py-2 border">Activity 2</th>
                <th className="px-3 py-2 border">Difference</th>
                <th className="px-3 py-2 border">p-adj</th>
                <th className="px-3 py-2 border">Lower</th>
                <th className="px-3 py-2 border">Upper</th>
                <th className="px-3 py-2 border">Significant?</th>
              </tr>
            </thead>
            <tbody>
              {tukeyHSD.map((row, idx) => (
                <tr key={idx} className="even:bg-[#F1F8E8]">
                  <td className="px-3 py-2 border">{ACTIVITY_LABELS[row.group1] || formatText(row.group1)}</td>
                  <td className="px-3 py-2 border">{ACTIVITY_LABELS[row.group2] || formatText(row.group2)}</td>
                  <td className="px-3 py-2 border">{row.meandiff}</td>
                  <td className="px-3 py-2 border">{row["p-adj"]}</td>
                  <td className="px-3 py-2 border">{row.lower}</td>
                  <td className="px-3 py-2 border">{row.upper}</td>
                  <td className={`px-3 py-2 border font-bold ${row.reject ? "text-green-600" : "text-gray-500"}`}>
                    {row.reject ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-[#888] mt-2">
            <b>What does this mean?</b><br />
            This table shows which pairs of activities had mood scores that were truly different from each other. If "Significant?" is "Yes", the difference is real and not just random.
          </div>
        </div>
      )}
    </div>
  );
};

const DailyAnova = () => {
  const [results, setResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [sleepHours, setSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [sleepMoodScoreId, setSleepMoodScoreId] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnova = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/anova/run`,
          { date },
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

  const handlePrev = () => setDate(addDays(date, -1));
  const handleNext = () => setDate(addDays(date, 1));

  const getDayLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    if (date === today) return 'Today';
    return getDateString(date);
  };

  const headerBg = {
    sleep: 'from-[#95D2B3] to-[#55AD9B]',
    activity: 'from-[#95D2B3] to-[#55AD9B]',
    social: 'from-[#95D2B3] to-[#55AD9B]',
    health: 'from-[#95D2B3] to-[#55AD9B]'
  };

  const gridData = [
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
                    className="flex flex-col items-center bg-[#FFF7E6] border-2 rounded-xl px-5 py-6 w-full"
                    style={{
                      borderColor:
                        sleepMoodScore > 0
                          ? POSITIVE_COLOR
                          : sleepMoodScore < 0
                          ? NEGATIVE_COLOR
                          : '#f7b801',
                      minHeight: 100,
                      maxWidth: 600,
                      margin: '0 auto'
                    }}
                  >
                    <span
                      className="px-4 py-1 rounded-full font-bold text-base mb-4"
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
                      <span
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor:
                            sleepMoodScore > 0
                              ? POSITIVE_COLOR
                              : sleepMoodScore < 0
                              ? NEGATIVE_COLOR
                              : '#f7b801',
                          color: '#fff'
                        }}
                      >
                        {`${Math.abs(sleepMoodScore)}%`}
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
  ];

  function renderCategoryResults(category, data) {
    if (!data || data.insufficient) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <span className="text-gray-500 text-lg text-center">
            {data && data.message
              ? data.message
              : 'No data for this category'}
          </span>
        </div>
      );
    }
    return (
      <>
        <FScoreAccordion f={data.F_value} p={data.p_value} />
        <TukeyHSDTable tukeyHSD={data.tukeyHSD} />
        {data.topPositive && data.topPositive.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon style={{ color: POSITIVE_COLOR }} />
              <span className="font-bold text-lg" style={{ color: POSITIVE_COLOR }}>
                Habits that boosted your mood
              </span>
            </div>
            {data.topPositive.map((item, idx) => (
              <div
                key={item.activity || item._id || idx}
                className="flex items-center gap-3 bg-[#F1F8E8] border-2 rounded-xl px-5 py-4 mb-3"
                style={{
                  borderColor: POSITIVE_COLOR,
                  minHeight: 60
                }}
              >
                <span className="flex-shrink-0">{getMoodIcon(item.moodScore)}</span>
                <span className="text-base text-[#272829] flex-1">{getMoodMessage(item.activity, item.moodScore, idx)}</span>
                <span
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: POSITIVE_COLOR,
                    color: '#fff'
                  }}
                >
                  {`${Math.abs(item.moodScore)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.topNegative && data.topNegative.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDownIcon style={{ color: NEGATIVE_COLOR }} />
              <span className="font-bold text-lg" style={{ color: NEGATIVE_COLOR }}>
                Habits that lowered your mood
              </span>
            </div>
            {data.topNegative.map((item, idx) => (
              <div
                key={item.activity || item._id || idx}
                className="flex items-center gap-3 bg-[#FFF7E6] border-2 rounded-xl px-5 py-4 mb-3"
                style={{
                  borderColor: NEGATIVE_COLOR,
                  minHeight: 60
                }}
              >
                <span className="flex-shrink-0">{getMoodIcon(item.moodScore)}</span>
                <span className="text-base text-[#272829] flex-1">{getMoodMessage(item.activity, item.moodScore, idx)}</span>
                <span
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: NEGATIVE_COLOR,
                    color: '#fff'
                  }}
                >
                  {`${Math.abs(item.moodScore)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <div className="bg-[#F7FBF9] py-8 border-b border-[#5EB5A6] mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-[#D8EFD3] transition"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-gray-500">{getDayLabel()}</div>
            <div className="flex justify-center items-center gap-2 mt-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full hover:bg-[#D8EFD3] transition"
                aria-label="Previous Day"
              >
                <ArrowBackIosNewIcon style={{ color: '#55AD9B' }} />
              </button>
              <span className="text-base text-[#5EB5A6] font-semibold">{getDateString(date)}</span>
              <button
                onClick={handleNext}
                className="p-2 rounded-full hover:bg-[#D8EFD3] transition"
                aria-label="Next Day"
                disabled={date >= new Date().toISOString().split('T')[0]}
                style={{ opacity: date >= new Date().toISOString().split('T')[0] ? 0.5 : 1 }}
              >
                <ArrowForwardIosIcon style={{ color: '#55AD9B' }} />
              </button>
            </div>
          </div>
          <div style={{ width: 40 }} /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#D8EFD3] border-t-[#55AD9B] rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-xl text-[#55AD9B] font-semibold">Analyzing your day...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {gridData.map((cat, idx) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl shadow-lg border-2 flex flex-col"
                style={{
                  borderColor: '#D8EFD3',
                  minHeight: 400,
                  background: '#fff'
                }}
              >
                {/* Card header */}
                <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${headerBg[cat.key]}`}>
                  <div className="flex items-center gap-3">
                    {cat.icon}
                    <h2 className="text-2xl font-bold text-white">{cat.title}</h2>
                  </div>
                  <div className="text-white/90 mt-1">{cat.header}</div>
                </div>
                {/* Card content */}
                <div className="flex-1 p-6 flex flex-col justify-center">{cat.content}</div>
              </motion.div>
            ))}
          </div>
        )}
        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-gradient-to-r from-[#D8EFD3] to-[#95D2B3] rounded-2xl p-6 mt-10"
        >
          <p className="text-[#272829] text-lg font-medium">
            🌟 Every day is a new opportunity to nurture your well-being! 🌟
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DailyAnova;