import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ContinueTrackingModal = ({ isOpen, onClose, onContinue, onFinish }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor: '#F1F8E8' }}
      >
        {/* Icon */}
        <div className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: '#95D2B3' }}
          >
            <span className="text-3xl">✨</span>
          </div>
        </div>

        {/* Title */}
        <h3 
          className="text-2xl font-bold mb-4 text-center"
          style={{ color: '#272829' }}
        >
          Great Job!
        </h3>
        
        {/* Message */}
        <p 
          className="text-lg mb-8 text-center leading-relaxed"
          style={{ color: '#272829' }}
        >
          Would you like to track another category or are you done for now?
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={onContinue}
            className="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
            style={{ 
              backgroundColor: '#55AD9B',
              color: '#F1F8E8'
            }}
          >
            Yes, track another category
          </button>
          
          <button
            onClick={onFinish}
            className="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg transform border-2"
            style={{ 
              backgroundColor: 'transparent',
              color: '#55AD9B',
              borderColor: '#55AD9B'
            }}
          >
            No, I'm done
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-6 text-center">
          <p 
            className="text-sm opacity-75"
            style={{ color: '#272829' }}
          >
            💡 You can always come back to track more categories later
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ContinueTrackingModal;
