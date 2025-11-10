import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Valence = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();

  const valenceOptions = [
    { 
      id: 'positive', 
      label: 'Positive', 
      color: '#55AD9B',
      path: '/before-positive'
    },
    { 
      id: 'negative', 
      label: 'Negative', 
      color: '#55AD9B',
      path: '/before-negative'
    },
    { 
      id: 'can\'t remember', 
      label: "I can't remember", 
      color: '#95D2B3',
      path: '/after-valence'
    }
  ];

  const handleValenceSelect = (option) => {
    // Save the selected before valence
    setCategoryFormData(prev => ({
      ...prev,
      beforeValence: option.id,
      // If "can't remember", explicitly set beforeEmotion to null and beforeIntensity to 0
      beforeEmotion: option.id === 'can\'t remember' ? null : prev.beforeEmotion,
      beforeIntensity: option.id === 'can\'t remember' ? 0 : prev.beforeIntensity
    }));
    
    console.log('Selected valence:', option.id);
    navigate(option.path);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page (could be different category pages)
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F1F8E8' }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #95D2B3 0%, rgba(149, 210, 179, 0.4) 40%, rgba(149, 210, 179, 0.1) 70%, transparent 100%)',
            top: '12%', 
            left: '10%' 
          }}
        ></div>
        
        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.5) 35%, rgba(85, 173, 155, 0.15) 65%, transparent 100%)',
            top: '25%', 
            right: '15%' 
          }}
        ></div>
        
        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #D8EFD3 0%, rgba(216, 239, 211, 0.6) 30%, rgba(216, 239, 211, 0.2) 60%, transparent 100%)',
            bottom: '20%', 
            left: '15%' 
          }}
        ></div>
        
        <div 
          className="absolute w-32 h-32 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #95D2B3 0%, rgba(149, 210, 179, 0.45) 38%, rgba(149, 210, 179, 0.12) 68%, transparent 100%)',
            bottom: '30%', 
            right: '12%' 
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        {/* Back Button */}
        <div
          onClick={handleBack}
          className="absolute top-8 left-8 text-2xl font-bold transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{ color: '#272829' }}
        >
          ←
        </div>

        {/* Title */}
        <h1 
          className="text-4xl font-bold mb-16 text-center max-w-2xl"
          style={{ color: '#272829' }}
        >
          How do you feel before doing the activity?
        </h1>

        {/* Valence Options */}
        <div className="flex flex-col space-y-6 w-full max-w-md">
          {valenceOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleValenceSelect(option)}
              className="w-full py-6 px-8 rounded-2xl text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg transform flex items-center justify-center space-x-4"
              style={{ 
                backgroundColor: '#95D2B3',
                color: '#272829'
              }}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Helper Text */}
        <div className="mt-12 text-center max-w-md">
          <p 
            className="text-sm opacity-80"
            style={{ color: '#272829' }}
          >
            💡 Take a moment to reflect on your emotional state before engaging in the activity
          </p>
        </div>
      </div>
    </div>
  );
};

export default Valence;