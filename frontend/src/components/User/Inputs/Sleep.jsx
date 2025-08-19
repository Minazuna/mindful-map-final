import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sleep = () => {
  const navigate = useNavigate();
  const [sleepHours, setSleepHours] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and ensure minimum is 0
    if (value === '' || (Number(value) >= 0 && !isNaN(value))) {
      setSleepHours(value);
    }
  };

  const handleSubmit = () => {
    if (sleepHours !== '' && Number(sleepHours) >= 0) {
      // For now, just navigate back to choose category or wherever you want
      // Later you can add API call to save the sleep hours
      console.log('Sleep hours:', sleepHours);
      navigate('/before-valence');
    }
  };

  const handleBack = () => {
    navigate('/choose-category');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#95D2B3' }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.4) 40%, rgba(85, 173, 155, 0.1) 70%, transparent 100%)',
            top: '10%', 
            left: '15%' 
          }}
        ></div>
        
        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.5) 35%, rgba(85, 173, 155, 0.15) 65%, transparent 100%)',
            top: '20%', 
            right: '20%' 
          }}
        ></div>
        
        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.6) 30%, rgba(85, 173, 155, 0.2) 60%, transparent 100%)',
            bottom: '25%', 
            left: '10%' 
          }}
        ></div>
        
        <div 
          className="absolute w-32 h-32 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.45) 38%, rgba(85, 173, 155, 0.12) 68%, transparent 100%)',
            bottom: '15%', 
            right: '15%' 
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
          className="text-5xl font-bold mb-8 text-center"
          style={{ color: '#272829' }}
        >
          Previous Night's Sleep
        </h1>

        <p 
          className="text-xl mb-16 text-center"
          style={{ color: '#272829' }}
        >
          How many hours did you sleep last night?
        </p>

        {/* Sleep Input Section */}
        <div className="w-full max-w-sm mb-12">
          {/* Input Field with Spinners */}
          <div className="mb-8">
            <input
              type="number"
              min="0"
              step="0.5"
              value={sleepHours}
              onChange={handleInputChange}
              placeholder="0.0"
              className="w-full p-6 text-4xl text-center rounded-2xl border-3 outline-none transition-all duration-300 focus:scale-105 focus:shadow-lg"
              style={{ 
                backgroundColor: '#F1F8E8',
                borderColor: '#55AD9B',
                color: '#272829',
                borderWidth: '3px'
              }}
            />
            <div className="text-center mt-4">
              <span 
                className="text-2xl font-semibold"
                style={{ color: '#272829' }}
              >
                hours
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={sleepHours === '' || Number(sleepHours) < 0}
            className={`w-full py-4 rounded-2xl text-xl font-bold transition-all duration-300 transform ${
              sleepHours !== '' && Number(sleepHours) >= 0 
                ? 'hover:scale-105 hover:shadow-lg' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ 
              backgroundColor: sleepHours !== '' && Number(sleepHours) >= 0 ? '#55AD9B' : '#D8EFD3',
              color: sleepHours !== '' && Number(sleepHours) >= 0 ? '#F1F8E8' : '#272829'
            }}
          >
            {sleepHours !== '' && Number(sleepHours) >= 0 ? 'Continue' : 'Enter sleep hours'}
          </button>
        </div>

        {/* Sleep Tips */}
        <div className="max-w-sm text-center">
          <p 
            className="text-base opacity-80"
            style={{ color: '#272829' }}
          >
            💡 Most adults need 7-9 hours of sleep per night for optimal health
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sleep;