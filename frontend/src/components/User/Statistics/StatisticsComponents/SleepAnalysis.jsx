import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PAGE_SIZE = 10;

const getPeriodText = (period) => {
  if (period === 'weekly') return 'this week';
  if (period === 'monthly') return 'this month';
  return '';
};

const SleepAnalysis = ({
  sleepHoursData,
  sleepAnalytics,
  sleepPeriod,
  setSleepPeriod,
  sleepChartRef
}) => {
  const [page, setPage] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const pagedSleepHoursData = useMemo(() => {
    if (sleepPeriod === 'monthly') {
      const start = page * PAGE_SIZE;
      return sleepHoursData.slice(start, start + PAGE_SIZE);
    }
    return sleepHoursData;
  }, [sleepHoursData, sleepPeriod, page]);

  const sleepHoursChartData = useMemo(() => ({
    labels: pagedSleepHoursData.map(data =>
      sleepPeriod === 'weekly'
        ? moment(data.date).format('ddd')
        : moment(data.date).format('MMM D')
    ),
    datasets: [
      {
        label: 'Hours of Sleep',
        data: pagedSleepHoursData.map(data => data.hours),
        borderColor: '#55AD9B',
        backgroundColor: 'rgba(149, 210, 179, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#55AD9B',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: '#95D2B3',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        borderWidth: 4,
      }
    ]
  }), [pagedSleepHoursData, sleepPeriod]);


  const sleepHoursChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(149, 210, 179, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#55AD9B',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          title: (context) => {
            return sleepPeriod === 'weekly'
              ? moment(pagedSleepHoursData[context[0].dataIndex].date).format('dddd')
              : moment(pagedSleepHoursData[context[0].dataIndex].date).format('MMMM D, YYYY');
          },
          label: (context) => `Sleep: ${context.raw} hours`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
        ticks: {
          stepSize: 2,
          callback: value => value + 'h',
          font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
          color: '#55AD9B'
        },
        grid: { color: 'rgba(149, 210, 179, 0.3)', lineWidth: 1 },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          color: '#55AD9B'
        },
        border: { display: false }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  };

  const totalPages = sleepPeriod === 'monthly'
    ? Math.ceil(sleepHoursData.length / PAGE_SIZE)
    : 1;

  const handlePrev = () => setPage(p => Math.max(0, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages - 1, p + 1));

  React.useEffect(() => { setPage(0); }, [sleepPeriod, sleepHoursData]);


  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-20"
    >
      <div className="p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
              <BedtimeIcon style={{ color: '#55AD9B', fontSize: 28 }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Sleep Analysis</h2>
              <p className="text-gray-600">Track your sleep hours and patterns</p>
            </div>
          </div>
          {/* Period Toggle */}
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
            <button
              onClick={() => setSleepPeriod('weekly')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                sleepPeriod === 'weekly'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSleepPeriod('monthly')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                sleepPeriod === 'monthly'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div ref={sleepChartRef} className="space-y-8">
          {/* Sleep Statistics Cards */}
          {sleepAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <div className="text-3xl font-bold text-blue-800 mb-2">
                  {sleepAnalytics.averageHours}h
                </div>
                <div className="text-sm font-medium text-blue-600">Average Sleep</div>
                <div className="text-xs text-blue-500 mt-1">
                  {sleepPeriod === 'weekly' ? 'This Week' : 'This Month'}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌟</span>
                </div>
                <div className="text-lg font-bold text-green-800 mb-2">
                  {sleepAnalytics.bestDay}
                </div>
                <div className="text-sm font-medium text-green-600">Best Sleep Day</div>
                <div className="text-xs text-green-500 mt-1">
                  {sleepAnalytics.bestDayHours}h of sleep
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="text-lg font-bold text-orange-800 mb-2">
                  {sleepAnalytics.worstDay}
                </div>
                <div className="text-sm font-medium text-orange-600">Least Sleep Day</div>
                <div className="text-xs text-orange-500 mt-1">
                  {sleepAnalytics.worstDayHours}h of sleep
                </div>
              </motion.div>
            </div>
          )}
          {/* Sleep Hours Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📈</span>
                Sleep Hours Trend
              </h3>
              <div className="text-sm text-gray-600">
                {sleepPeriod === 'weekly' ? 'Past 7 Days' : 'This Month'}
              </div>
            </div>
        <div className="h-80 w-full rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm border border-purple-200/50 relative">
          {pagedSleepHoursData.length > 0 ? (
            <>
              <Line data={sleepHoursChartData} options={sleepHoursChartOptions} />
              {sleepPeriod === 'monthly' && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    onClick={handlePrev}
                    disabled={page === 0}
                    className={`px-4 py-2 rounded-full bg-black text-white font-bold text-lg shadow transition 
                      ${page === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                    aria-label="Previous"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={page === totalPages - 1}
                    className={`px-4 py-2 rounded-full bg-black text-white font-bold text-lg shadow transition 
                      ${page === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                    aria-label="Next"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl opacity-70">😴</span>
                    </div>
                    <p className="text-gray-600 text-lg font-medium mb-2">No sleep data available</p>
                    <p className="text-gray-500 text-sm">Start logging your sleep to see insights</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Sleep Guide for Students (Ages 14-18)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">🌟</span>
                </div>
                <p className="text-sm font-semibold text-green-800 mb-1">Excellent</p>
                <p className="text-xs font-bold text-green-700">8-10 hours</p>
                <p className="text-xs text-green-600 mt-1">Perfect for school</p>
                <div className="mt-2 h-2 bg-green-200 rounded-full">
                  <div className="h-full w-full bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 mx-auto mb-3 bg-yellow-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">😊</span>
                </div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">Good</p>
                <p className="text-xs font-bold text-yellow-700">7-8 hours</p>
                <p className="text-xs text-yellow-600 mt-1">Still manageable</p>
                <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                  <div className="h-full w-4/5 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">😴</span>
                </div>
                <p className="text-sm font-semibold text-orange-800 mb-1">Low</p>
                <p className="text-xs font-bold text-orange-700">6-7 hours</p>
                <p className="text-xs text-orange-600 mt-1">May affect focus</p>
                <div className="mt-2 h-2 bg-orange-200 rounded-full">
                  <div className="h-full w-3/5 bg-orange-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">😰</span>
                </div>
                <p className="text-sm font-semibold text-red-800 mb-1">Critical</p>
                <p className="text-xs font-bold text-red-700">&lt;6 hours</p>
                <p className="text-xs text-red-600 mt-1">Impacts grades</p>
                <div className="mt-2 h-2 bg-red-200 rounded-full">
                  <div className="h-full w-2/5 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
            {/* Student-Specific Sleep Tips */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Sleep Tips for Better Grades & Well-being
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold text-lg">📚</span>
                    <div>
                      <p className="font-semibold text-blue-800">Study Performance</p>
                      <p className="text-blue-700">8+ hours = better memory retention and focus during exams</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold text-lg">⏰</span>
                    <div>
                      <p className="font-semibold text-blue-800">Sleep Schedule</p>
                      <p className="text-blue-700">Try to sleep and wake up at the same time, even on weekends</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold text-lg">📱</span>
                    <div>
                      <p className="font-semibold text-blue-800">Screen Time</p>
                      <p className="text-blue-700">Put devices away 1 hour before bedtime for better sleep quality</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold text-lg">🏃‍♂️</span>
                    <div>
                      <p className="font-semibold text-blue-800">Energy & Mood</p>
                      <p className="text-blue-700">Good sleep helps manage stress and improves social interactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Scientific Backing Section */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                <span className="mr-2">📖</span>
                Scientific Backing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-indigo-800 mb-2">Research Sources:</p>
                  <ul className="text-indigo-700 space-y-1">
                    <li>• National Sleep Foundation (2015)</li>
                    <li>• American Academy of Sleep Medicine</li>
                    <li>• CDC Sleep & School Performance Studies</li>
                    <li>• American Academy of Pediatrics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-indigo-800 mb-2">Key Findings:</p>
                  <ul className="text-indigo-700 space-y-1">
                    <li>• 8-10 hours optimal for teens (14-18)</li>
                    <li>• Sleep directly impacts academic performance</li>
                    <li>• Only 15% of teens get adequate sleep</li>
                    <li>• Memory consolidation occurs during sleep</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SleepAnalysis;