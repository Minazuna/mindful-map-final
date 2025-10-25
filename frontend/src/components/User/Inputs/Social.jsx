import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Social = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const [selectedSocial, setSelectedSocial] = useState(categoryFormData.activity || '');

  const socialOptions = [
    { id: 'alone', label: 'Alone', icon: '/images/alone.png' },
    { id: 'friends', label: 'Friend/s', icon: '/images/friend.png' },
    { id: 'family', label: 'Family', icon: '/images/family.png' },
    { id: 'classmates', label: 'Classmate/s', icon: '/images/classmate.png' },
    { id: 'relationship', label: 'Relationship', icon: '/images/relationship.png' },
    { id: 'online', label: 'Online Interaction', icon: '/images/onlineInteraction.png' },
    { id: 'pet', label: 'Pet', icon: '/images/pet.png' }
  ];

  const handleSocialSelect = (socialId) => {
    setSelectedSocial(socialId);
  };

  const handleNext = () => {
    if (selectedSocial) {
      // Save the selected social interaction to the form data
      setCategoryFormData(prev => ({
        ...prev,
        activity: selectedSocial
      }));
      
      console.log('Selected social:', selectedSocial);
      navigate('/before-valence');
    }
  };

  const handleBack = () => {
    navigate(-1);
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
          Select a Social Interaction
        </h1>

        {/* Disclaimer */}
        <p 
          className="text-lg font-medium mb-12 text-center"
          style={{ color: '#55AD9B' }}
        >
          * Only select one
        </p>

        {/* Social Options Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl">
          {socialOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSocialSelect(option.id)}
              className={`flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105 p-4 rounded-3xl ${
                selectedSocial === option.id ? 'ring-4 ring-opacity-60' : ''
              }`}
              style={{ 
                backgroundColor: selectedSocial === option.id ? '#95D2B3' : '#D8EFD3',
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
          disabled={!selectedSocial}
          className={`py-4 px-12 rounded-2xl text-xl font-bold transition-all duration-300 transform ${
            selectedSocial 
              ? 'hover:scale-105 hover:shadow-lg' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ 
            backgroundColor: selectedSocial ? '#55AD9B' : '#D8EFD3',
            color: selectedSocial ? '#F1F8E8' : '#272829'
          }}
        >
          {selectedSocial ? 'Next' : 'Select an option'}
        </button>
      </div>
    </div>
  );
};

export default Social;