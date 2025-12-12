import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';

const ConsecutiveNegativeModal = ({ isOpen, onClose, consecutiveCount }) => {
  const navigate = useNavigate();

  // Array of encouraging messages
  const encouragingMessages = useMemo(() => [
    {
      title: "We're Here For You 💚",
      message: "It's okay to have tough days. You're stronger than you think, and we believe in you. Remember, every moment is a chance to feel better.",
      supportText: "Reach out to someone you trust or explore our mental health resources below."
    },
    {
      title: "You've Got This! 🌟",
      message: "We see you're going through something challenging right now. That takes courage to acknowledge. You deserve support and kindness—especially from yourself.",
      supportText: "Browse our resources and remember: seeking help is a sign of strength."
    },
    {
      title: "Let's Turn Things Around 🌈",
      message: "Rough patches are part of life, but they don't define you. We're so glad you're tracking your emotions—that's the first step to feeling better.",
      supportText: "Explore calming activities and support tools designed just for you."
    },
    {
      title: "You Matter More Than You Know ✨",
      message: "Your feelings are valid, and you don't have to handle everything alone. Take a deep breath—better days are coming, and we're here to help.",
      supportText: "Check out our mental health resources and find what works best for you."
    },
    {
      title: "This Moment Doesn't Define Your Story 💫",
      message: "Life has ups and downs, and right now you're in a down moment. But that's temporary. You have the strength to bounce back—we know you do.",
      supportText: "Discover strategies and resources to lift your spirits."
    },
    {
      title: "You're Doing Better Than You Think 🎯",
      message: "The fact that you're here, tracking your emotions, and taking care of yourself shows real strength. Don't be hard on yourself right now.",
      supportText: "Lean on our support resources—you deserve to feel your best."
    }
  ], []);

  // Get a random message
  const randomMessage = useMemo(() => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }, [encouragingMessages, isOpen]);

  if (!isOpen) return null;

  const handleGoToResources = () => {
    onClose();
    navigate('/mental-health-resources');
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Heart Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 bg-gradient-to-br from-pink-100 to-red-100">
            <FavoriteIcon sx={{ fontSize: 48, color: '#e74c3c' }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">
          {randomMessage.title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-700 mb-6 text-center leading-relaxed">
          {randomMessage.message}
        </p>

        {/* Support Message */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FavoriteIcon sx={{ fontSize: 24, color: '#6fba94' }} />
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">We're here to support you</p>
              <p className="text-sm text-gray-700">
                {randomMessage.supportText}
              </p>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleGoToResources}
            className="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg transform bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white"
          >
            View Support Resources
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg transform border-2 border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
          >
            Thank You, I'm Okay.
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            💚 Your wellbeing is our priority. Take care of yourself.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ConsecutiveNegativeModal;
