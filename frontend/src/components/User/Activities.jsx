import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../BottomNav';
import { motion } from 'framer-motion';

// Material UI Icons and Components
import FavoriteIcon from '@mui/icons-material/Favorite';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const ActivityCard = ({ title, description, image, onClick, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.1), 0 15px 15px -10px rgba(0, 0, 0, 0.04)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-[480px]" // Increased height further
      onClick={onClick}
    >
      <div className="relative h-64"> {/* Increased image container height */}
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-5 w-full">
          <h3 className="font-bold text-white text-xl drop-shadow-md">{title}</h3>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-between border-t border-gray-50">
        <p className="text-gray-600 text-base leading-relaxed">
          {description}
        </p>
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <div 
            className="flex items-center text-base font-medium transition-all hover:opacity-80"
            style={{ color: color }}
          >
            Try now 
            <ArrowForwardIcon style={{ fontSize: 20, marginLeft: 6 }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BenefitCard = ({ icon, title, description, color, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col"
    >
      <div className="p-6 flex-1">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>
            {icon}
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-3" style={{ color }}>{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: color }}
      ></div>
    </motion.div>
  );
};

const Activities = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('activities');

  const activities = [
    {
      id: 'breathing',
      title: 'Breathing Exercises',
      description: 'Reduce stress and anxiety with guided breathing techniques. Practice mindful breathing for improved relaxation and mental clarity.',
      image: '/images/breathingexercise.gif',
      color: '#64aa86',
      onClick: () => navigate('/breathing-exercise')
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Technique',
      description: 'Boost productivity with timed work and break intervals. An effective method to maintain focus and prevent burnout.',
      image: '/images/pomodoro.gif',
      color: '#5a9edb', 
      onClick: () => navigate('/pomodoro')
    },
    {
      id: 'meditation',
      title: 'Guided Meditation',
      description: 'Experience deep relaxation with guided beach-setting meditation. Let the soothing sounds of waves wash away stress and restore inner calm.',
      image: '/images/meditation.gif',
      color: '#e3a857',
      onClick: () => navigate('/meditation')
    },
    {
      id: 'affirmation',
      title: 'Daily Affirmations',
      description: 'Build confidence and positive mindset through affirmations. Transform negative thoughts with powerful positive statements.',
      image: '/images/affirmation.gif',
      color: '#9c75d5',
      onClick: () => navigate('/affirmation')
    },
    {
      id: 'music',
      title: 'Calming Music',
      description: 'Relax with soothing melodies and nature sounds. Curated audio tracks designed to reduce anxiety and promote peaceful states of mind.',
      image: '/images/relaxingmusic.gif',
      color: '#d57583',
      onClick: () => navigate('/calming-music')
    }
  ];

  const benefits = [
    {
      title: 'Reduce Stress',
      description: 'Regular mindfulness practices help lower cortisol levels and promote relaxation. Studies show significant reductions in stress markers after just 8 weeks of practice.',
      color: '#64aa86',
      delay: 0.1,
      icon: <FavoriteIcon style={{ fontSize: 24 }} />
    },
    {
      title: 'Improve Focus',
      description: 'Mindful activities strengthen attention and reduce distractions in daily life. Training your mind to stay present enhances performance in work and studies.',
      color: '#5a9edb',
      delay: 0.2,
      icon: <PsychologyIcon style={{ fontSize: 24 }} />
    },
    {
      title: 'Enhance Wellbeing',
      description: 'Regular practice promotes emotional balance and overall mental health. Mindfulness cultivates a greater sense of happiness and life satisfaction.',
      color: '#9c75d5',
      delay: 0.3,
      icon: <SelfImprovementIcon style={{ fontSize: 24 }} />
    }
  ];

  return (
    <div className="bg-gradient-to-b from-[#f5f9fa] to-[#e8f1ee] min-h-screen flex flex-col">
      {/* Background elements */}
      <div className="absolute top-40 right-0 w-24 h-24 rounded-full bg-[#64aa86]/5 blur-2xl"></div>
      <div className="absolute top-80 left-0 w-32 h-32 rounded-full bg-[#5a9edb]/5 blur-2xl"></div>
      <div className="absolute bottom-60 right-10 w-32 h-32 rounded-full bg-[#9c75d5]/5 blur-2xl"></div>
      
      {/* Full-width colored header container - Updated color to #89bcbc */}
      <div className="w-full bg-[#89bcbc] py-12 mb-8 shadow-md">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Mindfulness Activities</h1>
          <p className="text-white text-opacity-90 max-w-2xl mx-auto text-lg">
            Discover curated activities designed to enhance your mental wellbeing and cultivate a mindful presence in everyday life.
          </p>
        </div>
      </div>

      {/* Activity Cards - with increased height */}
      <div className="px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="h-full"
            >
              <ActivityCard
                title={activity.title}
                description={activity.description}
                image={activity.image}
                color={activity.color}
                onClick={activity.onClick}
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Mental Health Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="px-6 py-4 mb-8"
      >
        <div className="bg-white rounded-xl p-8 shadow-md text-center relative border border-gray-50">
          <FormatQuoteIcon style={{ color: '#9c75d520', fontSize: 48, position: 'absolute', top: 16, left: 16 }} />
          <p className="text-[#2d5f5d] italic text-xl px-8 font-light">
            "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
          </p>
          <p className="text-[#5e8a87] text-sm mt-3">— Noam Shpancer</p>
        </div>
      </motion.div>

      {/* Benefit Cards - improved design */}
      <div className="px-6 py-4 mb-24">
        <h2 className="text-2xl font-bold text-[#2d5f5d] mb-5">Benefits of Mindfulness</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <BenefitCard 
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              color={benefit.color}
              delay={benefit.delay}
            />
          ))}
        </div>
      </div>

      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default Activities;