import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { generateActivitiesStatisticsPDF } from '../../../PDFTemplates/ActivitiesStatisticsPDF';
import { Download } from 'lucide-react';
ChartJS.register(ChartDataLabels);
ChartJS.register(ArcElement, Tooltip, Legend);

const pieColors = [
  '#8FABD4', '#59AC77', '#FF714B', '#f7b40bff', '#F564A9',
  '#A9A9A9', '#092b9cff', '#4e4d4dff', '#cc062dff', '#fdf8fdff'
];

const sectionGradients = {
  Activity: 'from-[#e0f7fa] via-[#b2ebf2] to-[#f7fafc]',
  Social: 'from-[#fceabb] via-[#f8b500] to-[#f7fafc]',
  Health: 'from-[#e0f7e9] via-[#b2f2bb] to-[#f7fafc]',
  Sleep: 'from-[#e0e7ff] via-[#b2b8f2] to-[#f7fafc]'
};

const activityImages = {
  commute: '/images/commute.png',
  exam: '/images/exam.png',
  homework: '/images/homework.png',
  project: '/images/project.png',
  study: '/images/study.png',
  read: '/images/read.png',
  extracurricular: '/images/extraCurricularActivities.png',
  'household-chores': '/images/householdChores.png',
  relax: '/images/relax.png',
  'watch-movie': '/images/watchMovie.png',
  'listen-music': '/images/listenToMusic.png',
  gaming: '/images/gaming.png',
  'browse-internet': '/images/browseInternet.png',
  shopping: '/images/shopping.png',
  travel: '/images/travel.png',
  alone: '/images/alone.png',
  friends: '/images/friend.png',
  family: '/images/family.png',
  classmates: '/images/classmate.png',
  relationship: '/images/relationship.png',
  online: '/images/onlineInteraction.png',
  pet: '/images/pet.png',
  jog: '/images/jog.png',
  walk: '/images/walk.png',
  exercise: '/images/exercise.png',
  meditate: '/images/meditate.png',
  sports: '/images/sports.png',
  'eat-healthy': '/images/eatHealthy.png',
  'no-physical': '/images/noPhysicalActivity.png',
  'eat-unhealthy': '/images/eatUnhealthy.png',
  'drink-alcohol': '/images/alcohol.png'
};

function beautifyName(name) {
  if (!name) return '';
  let str = name.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Friendly, student-focused summary phrases
function getSummaryPhrase(title, data) {
  if (!data || data.length === 0) return `No data for this category.`;
  const top = data[0];
  if (!top) return `No data for this category.`;
  if (title === 'Sleep') {
    return `Most students logged "${beautifyName(top.activity)}" hours of sleep most often (${top.count} times, ${top.percent}%). Getting enough sleep is important for your mood and focus!`;
  }
  if (top.percent >= 50) {
    return `The activity "${beautifyName(top.activity)}" made up more than half of your logs for this category (${top.count} times, ${top.percent}%).`;
  }
  if (top.percent >= 30) {
    return `"${beautifyName(top.activity)}" was the most common in this category (${top.count} times, ${top.percent}%).`;
  }
  return `You did "${beautifyName(top.activity)}" most often in this category (${top.count} times, ${top.percent}%).`;
}

function PieSection({ title, data, category, isSleepHours }) {
  const [showSummary, setShowSummary] = useState(false);
  const total = data.reduce((a, b) => a + b.count, 0);
  const chartData = {
    labels: data.map(item =>
      isSleepHours ? `${item.activity} hours of sleep` : beautifyName(item.activity)
    ),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map((_, idx) => pieColors[idx % pieColors.length]),
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderColor: '#fff'
      }
    ]
  };
        const chartOptions = {
        plugins: {
            legend: { display: false },
            datalabels: {
            color: '#fff',
            font: {
                weight: 'bold',
                size: 16,
            },
            formatter: (value) => value,
            },
            tooltip: {
            callbacks: {
                label: function (context) {
                const percent = total ? Math.round((context.raw / total) * 100) : 0;
                return `${context.label}: ${context.raw} (${percent}%)`;
                }
            }
            }
        },
        cutout: '68%'
        };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col bg-gradient-to-br ${sectionGradients[title] || 'from-[#f7fafc] to-[#e6f4ea]'} rounded-3xl shadow-2xl border-2 border-white min-h-[520px] w-full p-10`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(34, 139, 230, 0.12), 0 1.5px 6px 0 rgba(85, 173, 155, 0.10)'
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 px-2 pt-2">
          <h3 className="text-2xl font-extrabold tracking-wide text-center drop-shadow-md uppercase letter-spacing-wide"
            style={{
              color:
                title === 'Activity' ? '#0ea5e9' :
                title === 'Social' ? '#f9952bff' :
                title === 'Health' ? '#22c55e' :
                title === 'Sleep' ? '#6366f1' : '#55AD9B'
            }}
          >
            {title}
          </h3>
          <button
            onClick={() => setShowSummary(v => !v)}
            className={`ml-2 px-4 py-1 rounded-full text-sm font-semibold shadow transition
              ${showSummary
                ? 'bg-[#55AD9B] text-white'
                : 'bg-white/80 text-[#55AD9B] border border-[#55AD9B] hover:bg-[#55AD9B] hover:text-white'}
            `}
            aria-label="Show summary"
          >
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </button>
        </div>
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mb-4 mt-2 rounded-xl bg-white/90 border border-[#e0e7ef] px-6 py-4 text-[#272829] text-base font-medium shadow max-w-xl"
            >
              {getSummaryPhrase(title, data)}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col justify-center">
          {data.length > 0 ? (
            <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-12 h-full">
              <div className="flex flex-col items-center justify-center flex-shrink-0 md:w-1/2 w-full h-full">
                <div className="w-56 h-56 flex items-center justify-center bg-white rounded-full shadow-xl border-4 border-[#fff] mx-auto">
                  <Pie data={chartData} options={chartOptions} />
                </div>
                <span className="mt-5 text-xl font-extrabold text-[#272829] bg-white/80 px-6 py-2 rounded-full shadow border-2 border-[#e0e7ef]">
                  {total} total
                </span>
              </div>
              <div className="flex-1 w-full flex flex-col justify-center items-center md:w-1/2 h-full">
                <ul className="space-y-4 max-w-md w-full mx-auto">
                  {data.map((item, idx) => {
                    const percent = total ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <li
                        key={item.activity}
                        className="flex items-center justify-between bg-white/90 rounded-xl px-6 py-3 border border-[#e0e7ef] shadow-sm hover:shadow-md transition-all duration-200"
                        style={{ maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {category !== 'Sleep' && activityImages[item.activity] && (
                            <img
                              src={activityImages[item.activity]}
                              alt={item.activity}
                              className="w-8 h-8 "
                              style={{ objectFit: 'contain' }}
                            />
                          )}
                          <span className="font-semibold text-[#55AD9B] truncate text-base">
                            {isSleepHours ? `${item.activity} hours of sleep` : beautifyName(item.activity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 min-w-[70px] justify-end">
                          <span className="font-bold text-[#272829]">{item.count}</span>
                          <span className="font-bold text-[#55AD9B]">{percent}%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-gray-400 text-center py-8 italic text-base w-full">No data for this category.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const ActivitiesStatistics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { emotion, moodType, moodPeriod } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState({ activity: [], social: [], health: [], sleep: [] });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateActivitiesStatisticsPDF(emotion, moodType, moodPeriod, showSections);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!emotion || !moodType || !moodPeriod) {
      navigate('/statistics');
      return;
    }
    setLoading(true);
    fetch(
      `${import.meta.env.VITE_NODE_API}/api/statistics/mood-activities?emotion=${encodeURIComponent(emotion)}&moodType=${moodType}&period=${moodPeriod}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        setGrouped(data.groupedActivities || { activity: [], social: [], health: [], sleep: [] });
        setLoading(false);
      });
  }, [emotion, moodType, moodPeriod, navigate]);

  const gridSections = [
    { title: 'Activity', data: grouped.activity, category: 'Activity' },
    { title: 'Social', data: grouped.social, category: 'Social' },
    { title: 'Health', data: grouped.health, category: 'Health' },
    { title: 'Sleep', data: grouped.sleep, category: 'Sleep', isSleepHours: true }
  ];

  const showSections = moodType === 'after'
    ? gridSections
    : gridSections.filter(section => section.title !== 'Sleep');

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-[#f7fafc] via-[#e0f7fa] to-[#e6f4ea] min-h-screen pb-16"
    >
      <div className="max-w-[1600px] mx-auto px-12 pt-10">
        <div className="flex items-center mb-10 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#0ea5e9] text-white font-bold shadow-lg hover:from-[#3e8e7e] hover:to-[#0ea5e9] transition text-lg border-2 border-[#55AD9B] hover:border-[#3e8e7e]"
            style={{ minWidth: 100 }}
          >
            ← Back
          </button>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] via-[#55AD9B] to-[#f59e42] mb-1 tracking-wide drop-shadow-lg">
              {emotion ? beautifyName(emotion) : ''}
            </h2>
            <p className="text-gray-600 text-lg font-semibold">
              {moodType === 'before' ? 'Before' : 'After'} Emotion · {moodPeriod.charAt(0).toUpperCase() + moodPeriod.slice(1)}
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || loading}
            className={`px-6 py-2 rounded-full font-bold shadow-lg transition text-lg border-2 flex items-center gap-2
              ${isGeneratingPDF || loading
                ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#f59e42] to-[#ff714b] text-white border-[#f59e42] hover:from-[#e68a2e] hover:to-[#e65a3a]'
              }`}
            style={{ minWidth: 150 }}
          >
            <Download size={20} />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-20 h-20 border-4 border-[#D8EFD3] border-t-[#55AD9B] rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {showSections.map(section => (
                <PieSection
                  key={section.title}
                  title={section.title}
                  data={section.data}
                  category={section.category}
                  isSleepHours={section.isSleepHours}
                />
              ))}
            </div>
            {moodType === 'before' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/90 rounded-2xl shadow p-8 border border-gray-100 max-w-2xl mx-auto mt-8 text-center"
              >
                <span className="text-gray-400 text-lg italic">
                  Sleep hours breakdown is only available for 'After' moods.
                </span>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ActivitiesStatistics;