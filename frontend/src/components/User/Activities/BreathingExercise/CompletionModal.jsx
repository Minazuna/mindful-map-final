import React, { useEffect, useState } from 'react';
import { Modal, Box } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const CompletionModal = ({ open, onClose, technique, duration, streak, onRestartSession, onViewProgress }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const getCompletionMessage = () => {
    if (streak === 1) return "Congratulations on your first session! 🎉";
    if (streak < 7) return "Great job building your breathing habit! 💪";
    if (streak < 30) return "You're on an amazing streak! Keep it up! 🔥";
    return "You're a breathing master! Incredible dedication! 🧘‍♀️";
  };

  const getNextGoal = () => {
    if (streak < 7) return "Try to reach a 7-day streak!";
    if (streak < 30) return "Can you make it to 30 days?";
    return "You've mastered consistency! Try a new technique!";
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                initial={{ 
                  top: "50%", 
                  left: "50%",
                  scale: 0 
                }}
                animate={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  scale: 1 
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-t-2xl text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CheckCircleIcon style={{ fontSize: 64 }} />
          </motion.div>
          <h2 className="text-2xl font-bold mt-4">Session Complete!</h2>
          <p className="text-green-100 mt-2">{getCompletionMessage()}</p>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Summary */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-gray-800 mb-3">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: technique.color }}>
                  {technique.icon}
                </div>
                <div className="text-sm text-gray-600 mt-1">{technique.name}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{duration.label}</div>
                <div className="text-sm text-gray-600 mt-1">Duration</div>
              </div>
            </div>
          </div>
          
          {/* Streak Info */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-orange-800 flex items-center">
                <EmojiEventsIcon className="mr-2" />
                Current Streak
              </h3>
              <span className="text-2xl font-bold text-orange-600">{streak}</span>
            </div>
            <p className="text-orange-700 text-sm">{getNextGoal()}</p>
          </div>
          
          {/* Benefits Reminder */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <h3 className="font-bold text-blue-800 mb-2">Benefits You Just Gained:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              {technique.benefits.slice(0, 3).map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircleIcon style={{ fontSize: 16 }} className="mr-2 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              onClick={() => {
                onClose();
                onRestartSession();
              }}
              className="flex items-center justify-center py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RestartAltIcon className="mr-2" />
              Another Session
            </motion.button>
            
            <motion.button 
              onClick={onViewProgress}
              className="flex items-center justify-center py-3 bg-gray-600 text-white rounded-lg font-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingUpIcon className="mr-2" />
              View Progress
            </motion.button>
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default CompletionModal;