import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ContinueTrackingModal from './ContinueTrackingModal';

const AfterNegative = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState(0);
  const [reason, setReason] = useState('');
  const [showContinueModal, setShowContinueModal] = useState(false);

  const emotions = [
    { id: 'bored', emoji: '😑', label: 'Bored' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'disappointed', emoji: '😞', label: 'Disappointed' },
    { id: 'angry', emoji: '😠', label: 'Angry' },
    { id: 'tense', emoji: '😰', label: 'Tense' }
  ];

  const intensityLevels = [1, 2, 3, 4, 5];

  const handleEmotionSelect = (emotionId) => {
    setSelectedEmotion(emotionId);
    setIntensity(0); // Reset intensity when changing emotion
  };

  const handleIntensitySelect = (level) => {
    setIntensity(level);
  };

  const handleContinueTracking = () => {
    setShowContinueModal(false);
    navigate('/choose-category');
  };

  const handleFinishTracking = () => {
    setShowContinueModal(false);
    navigate('/mood-entries');
  };

  const handleSubmit = async () => {
    if (selectedEmotion && intensity > 0 && reason.trim()) {
      // Count words in reason
      const wordCount = reason.trim().split(/\s+/).length;
      if (wordCount > 100) {
        alert('Please limit your response to 100 words or less.');
        return;
      }

      try {
        // Update the category form data with after emotions
        const finalFormData = {
          ...categoryFormData,
          afterValence: 'negative',
          afterEmotion: selectedEmotion,
          afterIntensity: intensity,
          afterReason: reason.trim()
        };

        console.log('Final category form data:', finalFormData);

        // Submit to API
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in again.');
          return;
        }

        const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/mood-log`, finalFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Mood log saved:', response.data);
        
        if (response.data.success) {
          toast.success('Mood log saved successfully!');
          
          // Reset category form data
          setCategoryFormData({
            category: '',
            activity: '',
            hrs: 0,
            beforeValence: '',
            beforeEmotion: null,
            beforeIntensity: 0,
            beforeReason: null,
            afterValence: '',
            afterEmotion: '',
            afterIntensity: 0,
            afterReason: '',
            selectedDate: null, // Reset selectedDate as well
            selectedTime: null  // Reset selectedTime as well
          });
          
          // Show the continue tracking modal
          setShowContinueModal(true);
        } else {
          toast.error('Failed to save mood log');
        }
      } catch (error) {
        console.error('Error saving mood log:', error);
        toast.error(error.response?.data?.message || 'Error saving mood log');
      }
    }
  };

  const handleBack = () => {
    navigate('/after-valence');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F1F8E8' }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #95D2B3 0%, rgba(149, 210, 179, 0.4) 40%, rgba(149, 210, 179, 0.1) 70%, transparent 100%)',
            top: '15%', 
            left: '12%' 
          }}
        ></div>
        
        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.5) 35%, rgba(85, 173, 155, 0.15) 65%, transparent 100%)',
            top: '20%', 
            right: '18%' 
          }}
        ></div>
        
        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #D8EFD3 0%, rgba(216, 239, 211, 0.6) 30%, rgba(216, 239, 211, 0.2) 60%, transparent 100%)',
            bottom: '25%', 
            left: '8%' 
          }}
        ></div>
        
        <div 
          className="absolute w-16 h-16 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #95D2B3 0%, rgba(149, 210, 179, 0.45) 38%, rgba(149, 210, 179, 0.12) 68%, transparent 100%)',
            bottom: '15%', 
            right: '20%' 
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-12">
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
          className="text-4xl font-bold mb-12 text-center"
          style={{ color: '#272829' }}
        >
          Select Your Negative Emotion After
        </h1>

        {/* Emotions Grid */}
        <div className="grid grid-cols-5 gap-6 mb-12">
          {emotions.map((emotion) => (
            <div
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105 p-4 rounded-2xl ${
                selectedEmotion === emotion.id ? 'ring-4 ring-opacity-60' : ''
              }`}
              style={{ 
                backgroundColor: selectedEmotion === emotion.id ? '#95D2B3' : 'transparent',
                ringColor: '#55AD9B'
              }}
            >
              <div className="text-6xl mb-3">{emotion.emoji}</div>
              <span 
                className="text-lg font-medium text-center"
                style={{ color: '#272829' }}
              >
                {emotion.label}
              </span>
            </div>
          ))}
        </div>

        {/* Intensity Rating */}
        {selectedEmotion && (
          <div className="w-full max-w-md mb-8">
            <h2 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ color: '#272829' }}
            >
              Rate the Intensity
            </h2>
            
            <div className="flex justify-between items-center mb-4">
              {intensityLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleIntensitySelect(level)}
                  className={`w-12 h-12 rounded-full text-xl font-bold transition-all duration-300 hover:scale-110 flex items-center justify-center ${
                    intensity === level ? 'ring-4 ring-opacity-60' : ''
                  }`}
                  style={{ 
                    backgroundColor: intensity === level ? '#55AD9B' : '#95D2B3',
                    color: intensity === level ? '#F1F8E8' : '#272829',
                    ringColor: '#55AD9B'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between text-sm font-medium" style={{ color: '#272829' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {/* Reason Input */}
        {selectedEmotion && intensity > 0 && (
          <div className="w-full max-w-md mb-8">
            <h3 
              className="text-xl font-semibold mb-4 text-center"
              style={{ color: '#272829' }}
            >
              Why do you feel that way?
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe what made you feel this way..."
              className="w-full p-4 rounded-2xl border-2 resize-none"
              style={{ 
                backgroundColor: '#D8EFD3',
                borderColor: '#95D2B3',
                color: '#272829',
                minHeight: '120px'
              }}
              maxLength={500}
            />
            <div className="text-right mt-2">
              <span 
                className="text-sm"
                style={{ color: reason.trim().split(/\s+/).length > 100 ? '#dc2626' : '#272829' }}
              >
                {reason.trim() === '' ? 0 : reason.trim().split(/\s+/).length}/100 words
              </span>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedEmotion || intensity === 0 || !reason.trim()}
          className={`w-full max-w-md py-4 rounded-2xl text-xl font-bold transition-all duration-300 transform ${
            selectedEmotion && intensity > 0 && reason.trim()
              ? 'hover:scale-105 hover:shadow-lg' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ 
            backgroundColor: selectedEmotion && intensity > 0 && reason.trim() ? '#55AD9B' : '#D8EFD3',
            color: selectedEmotion && intensity > 0 && reason.trim() ? '#F1F8E8' : '#272829'
          }}
        >
          {selectedEmotion && intensity > 0 && reason.trim() ? 'Continue' : 'Complete all fields to continue'}
        </button>

        {/* Helper Text */}
        <div className="mt-6 text-center max-w-md">
          <p 
            className="text-sm opacity-80"
            style={{ color: '#272829' }}
          >
            💡 Choose the emotion that best describes how you feel after the activity and rate its intensity from 1 (low) to 5 (high)
          </p>
        </div>
      </div>

      {/* Continue Tracking Modal */}
      <ContinueTrackingModal
        isOpen={showContinueModal}
        onContinue={handleContinueTracking}
        onFinish={handleFinishTracking}
      />
    </div>
  );
};

export default AfterNegative;