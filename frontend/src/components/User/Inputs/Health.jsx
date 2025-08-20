import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Health = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const [selectedHealth, setSelectedHealth] = useState(categoryFormData.activity || '');

  const healthOptions = [
    { id: 'jog', label: 'Jog', icon: '/images/jog.png' },
    { id: 'walk', label: 'Walk', icon: '/images/walk.png' },
    { id: 'exercise', label: 'Exercise', icon: '/images/exercise.png' },
    { id: 'meditate', label: 'Meditate', icon: '/images/meditate.png' },
    { id: 'eat-healthy', label: 'Eat Healthy', icon: '/images/eatHealthy.png' },
    { id: 'no-physical', label: 'No Physical Activity', icon: '/images/noPhysicalActivity.png' },
    { id: 'eat-unhealthy', label: 'Eat Unhealthy', icon: '/images/eatUnhealthy.png' },
    { id: 'drink-alcohol', label: 'Drink Alcohol', icon: '/images/drinkAlcohol.png' }
  ];

  const handleHealthSelect = (healthId) => {
    setSelectedHealth(healthId);
  };

  const handleNext = () => {
    if (selectedHealth) {
      // Save the selected health activity to the form data
      setCategoryFormData(prev => ({
        ...prev,
        activity: selectedHealth
      }));
      
      console.log('Selected health activity:', selectedHealth);
      navigate('/before-valence');
    }
  };

  const handleBack = () => {
    navigate('/choose-category');
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
          className="text-4xl font-bold mb-4 text-center"
          style={{ color: '#272829' }}
        >
          Health-related Activities
        </h1>

        {/* Disclaimer */}
        <p 
          className="text-lg font-medium mb-12 text-center"
          style={{ color: '#55AD9B' }}
        >
          * Only select one
        </p>

        {/* Health Options Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-6xl">
          {healthOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleHealthSelect(option.id)}
              className={`flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105 p-4 rounded-3xl ${
                selectedHealth === option.id ? 'ring-4 ring-opacity-60' : ''
              }`}
              style={{ 
                backgroundColor: selectedHealth === option.id ? '#95D2B3' : '#D8EFD3',
                ringColor: '#55AD9B'
              }}
            >
              <div className="w-24 h-24 mb-3 flex items-center justify-center">
                <img
                  src={option.icon}
                  alt={option.label}
                  className="w-full h-full object-contain"
                />
              </div>
              <span 
                className="text-lg font-large text-center"
                style={{ color: '#272829' }}
              >
                {option.label}
              </span>
            </div>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!selectedHealth}
          className={`py-4 px-12 rounded-2xl text-xl font-bold transition-all duration-300 transform ${
            selectedHealth 
              ? 'hover:scale-105 hover:shadow-lg' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ 
            backgroundColor: selectedHealth ? '#55AD9B' : '#D8EFD3',
            color: selectedHealth ? '#F1F8E8' : '#272829'
          }}
        >
          {selectedHealth ? 'Next' : 'Select an option'}
        </button>


      </div>
    </div>
  );
};

export default Health;