import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ChooseCategory = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a date parameter in the URL
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      // Set the date in the form data if it exists
      setCategoryFormData(prev => ({
        ...prev,
        selectedDate: dateParam
      }));
    }
  }, [location.search, setCategoryFormData]);

  const categories = [
    { name: 'Activities', path: '/overall-activities', categoryKey: 'activity' },
    { name: 'Social Interactions', path: '/social-interactions', categoryKey: 'social' },
    { name: 'Health-related Activities', path: '/health-activities', categoryKey: 'health' },
    { name: 'Previous Night\'s Sleep (No. of Hours)', path: '/sleep-hours', categoryKey: 'sleep' }
  ];

  const handleCategorySelect = (path, categoryKey) => {
    // Set the selected category
    setCategoryFormData(prev => ({
      ...prev,
      category: categoryKey,
      // Reset other fields when changing category but preserve selectedDate
      activity: '',
      hrs: 0,
      beforeValence: '',
      beforeEmotion: null,
      beforeIntensity: 0,
      beforeReason: null,
      afterValence: '',
      afterEmotion: '',
      afterIntensity: 0,
      afterReason: ''
    }));
    
    navigate(path);
  };

  const handleSkip = () => {
    navigate('/mood-entries');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#95D2B3' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-32 h-32 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.4) 40%, rgba(85, 173, 155, 0.1) 70%, transparent 100%)',
            top: '15%', 
            left: '10%' 
          }}
        ></div>
        

        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.5) 35%, rgba(85, 173, 155, 0.15) 65%, transparent 100%)',
            top: '10%', 
            right: '15%' 
          }}
        ></div>
        

        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.6) 30%, rgba(85, 173, 155, 0.2) 60%, transparent 100%)',
            top: '60%', 
            left: '8%' 
          }}
        ></div>

        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.45) 38%, rgba(85, 173, 155, 0.12) 68%, transparent 100%)',
            bottom: '20%', 
            right: '12%' 
          }}
        ></div>

        <div 
          className="absolute w-16 h-16 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.7) 25%, rgba(85, 173, 155, 0.25) 55%, transparent 100%)',
            top: '45%', 
            right: '45%' 
          }}
        ></div>
      </div>


      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        <h1 
          className="text-5xl font-bold mb-16 text-center"
          style={{ color: '#272829' }}
        >
          Choose a Category
        </h1>

        <div className="flex flex-col space-y-6 w-full max-w-md mb-8">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => handleCategorySelect(category.path, category.categoryKey)}
              className="w-full py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
              style={{ 
                backgroundColor: '#F1F8E8',
                color: '#272829'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>


        <span
          onClick={handleSkip}
          className="text-xl font-bold cursor-pointer transition-all duration-300 hover:scale-105"
          style={{ color: '#272829' }}
        >
          I'll do it later
        </span>

        <div className="mt-12 text-center">
          <div 
            className="inline-block w-16 h-1 rounded-full opacity-60"
            style={{ backgroundColor: '#55AD9B' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ChooseCategory;