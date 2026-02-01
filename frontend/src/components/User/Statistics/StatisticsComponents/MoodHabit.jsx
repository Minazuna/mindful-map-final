import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';

const MoodHabit = () => {
  const navigate = useNavigate();

  const handleMoodHabitClick = () => {
    navigate('/mood-habit-analysis');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
    >
      <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
            <AssessmentIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>
              Mood & Habits Analysis
            </h2>
            <p className="text-gray-600">
              Insights from your mood and habit logs to support your recommendations
            </p>
          </div>
        </div>

        <p className="text-gray-700 mb-8 leading-relaxed text-justify">
          This dashboard uses your logged moods and habits to highlight patterns—like how you tend to feel before and
          after different activities, social time, health habits, and sleep. These insights help form the basis of the
          recommendations you receive, so you can spot what’s helping, what’s not, and what to try next.
        </p>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMoodHabitClick}
            className="flex items-center w-full sm:w-[500px] bg-white border border-[#d6e3df] rounded-2xl shadow-sm px-8 py-5 transition-all duration-200 hover:shadow-md"
            style={{ minHeight: 90, maxWidth: 520 }}
          >
            <CalendarViewDayIcon className="mr-4" style={{ fontSize: 32, color: '#55AD9B' }} />
            <div className="flex flex-col items-start">
              <span className="text-lg font-semibold text-[#222] mb-1">Daily Statistics</span>
              <span className="text-[#256353] text-base font-normal opacity-70">
                Today&apos;s mood and habit insights
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodHabit;