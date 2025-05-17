import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MoodLog = ({ setFormData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState('');
  const [logDate, setLogDate] = useState(new Date());

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    
    console.log('Date Parameter:', dateParam); // Log the raw date parameter
    
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      
      console.log('Parsed Date:', {
        year,
        month,
        day,
        dateObject: new Date(year, month - 1, day)
      }); // Log parsed date details
      
      const localDate = new Date(year, month - 1, day);
      setLogDate(localDate);
    }
  }, [location.search]);

  const handleMoodClick = (mood) => {
    setSelectedMood(mood);
    setFormData((prevData) => ({ 
      ...prevData, 
      mood, 
      date: logDate.toISOString().split('T')[0] 
    }));
  };

  const handleContinueClick = () => {
    if (!selectedMood) {
      setError('Please select a mood before continuing.');
      return;
    }
    
    const dateToSend = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
  
  console.log('Date being sent:', dateToSend);
  
  setFormData((prevData) => ({ 
    ...prevData, 
    mood: selectedMood,
    date: dateToSend 
  }));
    
    navigate('/log-activities', { state: { mood: selectedMood } });
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const day = daysOfWeek[logDate.getDay()];
  const date = `${months[logDate.getMonth()]} ${logDate.getDate()}`;
  const time = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const moods = [
    { name: 'Happy', icon: '/images/happy.gif' },
    { name: 'Fine', icon: '/images/fine.gif' },
    { name: 'Anxious', icon: '/images/anxious.gif' },
    { name: 'Sad', icon: '/images/sad.gif' },
    { name: 'Angry', icon: '/images/angry.gif' },
  ];

  return (
    <div className="bg-[#eef0ee] h-screen flex flex-col items-center justify-center relative">
      <h2 className="text-5xl font-bold mb-2">What are you feeling?</h2>
      <div className="flex justify-between w-full max-w-md px-10 mb-6">
        <div className="text-sm text-left w-1/2">
          <p>{day}, {date}</p>
        </div>
        <div className="text-sm text-right w-1/2">
          <p>{time}</p>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex space-x-6">
        {moods.map((mood) => (
          <div
            key={mood.name}
            onClick={() => handleMoodClick(mood.name)}
            className="relative cursor-pointer text-center"
          >
            <img
              src={mood.icon}
              alt={mood.name}
              className={`w-28 h-28 mx-auto mb-2 ${selectedMood === mood.name ? 'opacity-60' : ''}`}
            />
            {selectedMood === mood.name && (
              <div className="absolute top-0 right-0 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✔</span>
              </div>
            )}
            <p>{mood.name}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleContinueClick}
        className="absolute bottom-10 right-10 bg-[#6fba94] text-white font-bold py-2 px-4 rounded-full hover:bg-[#5aa88f]"
      >
        Continue
      </button>
    </div>
  );
};

export default MoodLog;