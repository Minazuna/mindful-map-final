import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';

const Anova = () => {
  const navigate = useNavigate();

  const handleDailyAnovaClick = () => {
    navigate('/daily-anova');
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
            <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Mood & Habits Analysis</h2>
            <p className="text-gray-600">Statistical insights into how your habits affect mood</p>
          </div>
        </div>

        <p className="text-gray-700 mb-8 leading-relaxed">
          This dashboard combines several methods: per‑activity average mood change from your logs
          (before vs. after), one‑way ANOVA to test for differences across activities, and Tukey’s
          HSD for pairwise comparisons (only activities with at least 2 logs are included). Sleep
          impact is derived from hours/quality to a mood score.
        </p>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDailyAnovaClick}
            className="flex items-center w-full sm:w-[500px] bg-white border border-[#d6e3df] rounded-2xl shadow-sm px-8 py-5 transition-all duration-200 hover:shadow-md"
            style={{ minHeight: 90, maxWidth: 520 }}
          >
            <CalendarViewDayIcon className="mr-4" style={{ fontSize: 32, color: '#55AD9B' }} />
            <div className="flex flex-col items-start">
              <span className="text-lg font-semibold text-[#222] mb-1">Daily Statistics</span>
              <span className="text-[#256353] text-base font-normal opacity-70">Today's activity impact analysis</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Anova;