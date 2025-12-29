import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../BottomNav';
import { motion } from 'framer-motion';

// Material UI Icons
import SpaIcon from '@mui/icons-material/Spa';
import TimerIcon from '@mui/icons-material/Timer';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const activityIcons = {
  breathing: <SpaIcon style={{ fontSize: 28, color: '#64aa86' }} />,
  pomodoro: <TimerIcon style={{ fontSize: 28, color: '#5a9edb' }} />,
  meditation: <SelfImprovementIcon style={{ fontSize: 28, color: '#b084c8' }} />,
  affirmation: <FavoriteBorderIcon style={{ fontSize: 28, color: '#9c75d5' }} />,
  music: <MusicNoteIcon style={{ fontSize: 28, color: '#d57583' }} />,
};

const activities = [
  {
    id: 'breathing',
    title: 'Breathing Exercises',
    description: 'Reduce stress and anxiety with guided breathing techniques. ',
    color: '#64aa86',
    icon: activityIcons.breathing,
    onClick: (navigate) => navigate('/breathing-exercise'),
    border: 'border-[#64aa86]',
    text: 'text-[#247a5a]',
    bg: 'bg-[#e6f4ea]',
    shadow: 'shadow-[#64aa86]/10',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Technique',
    description: 'Boost productivity with timed work and break intervals.',
    color: '#5a9edb',
    icon: activityIcons.pomodoro,
    onClick: (navigate) => navigate('/pomodoro'),
    border: 'border-[#5a9edb]',
    text: 'text-[#245a7a]',
    bg: 'bg-[#eaf3fa]',
    shadow: 'shadow-[#5a9edb]/10',
  },
  {
    id: 'meditation',
    title: 'Guided Meditation',
    description: 'Experience deep relaxation with different guided meditations.',
    color: '#b084c8',
    icon: activityIcons.meditation,
    onClick: (navigate) => navigate('/guided-meditation'),
    border: 'border-[#b084c8]',
    text: 'text-[#6c4a7a]',
    bg: 'bg-[#f3eafc]',
    shadow: 'shadow-[#b084c8]/10',
  },
  {
    id: 'affirmation',
    title: 'Daily Affirmation',
    description: 'Build confidence and positive mindset through affirmations. ',
    color: '#9c75d5',
    icon: activityIcons.affirmation,
    onClick: (navigate) => navigate('/affirmation'),
    border: 'border-[#9c75d5]',
    text: 'text-[#5a3a7a]',
    bg: 'bg-[#f3eafc]',
    shadow: 'shadow-[#9c75d5]/10',
  },
  {
    id: 'music',
    title: 'Calming Music',
    description: 'Relax with soothing melodies to reduce stress.',
    color: '#d57583',
    icon: activityIcons.music,
    onClick: (navigate) => navigate('/calming-music'),
    border: 'border-[#d57583]',
    text: 'text-[#7a3a4a]',
    bg: 'bg-[#faeaea]',
    shadow: 'shadow-[#d57583]/10',
  },
];

const Activities = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('activities');

  return (
    <div className="bg-gradient-to-b from-[#e6f4ea] to-[#f5f9fa] min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-56 h-56 rounded-full bg-[#b7eacb]/30 blur-[80px]" />
        <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full bg-[#5a9edb]/20 blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#e6f4ea]/40 blur-[120px]" />
        <div className="absolute bottom-24 right-10 w-32 h-32 rounded-full bg-[#9c75d5]/20 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="w-full bg-[#ffff] py-12 mb-8 shadow-lg relative z-10 rounded-b-3xl">
        <div className="max-w-xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-[#1b5f52] mb-2 tracking-tight bg-clip-text bg-gradient-to-r from-[#1b5f52] to-[#64aa86] text-transparent"
          >
            Mindfulness Activities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#1b5f52]/80 text-lg font-medium"
          >
            Choose an activity to support your mental well-being
          </motion.p>
        </div>
      </div>

      {/* Activities List - Horizontal square cards */}
      <div className="flex-1 px-4 pb-24 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-row gap-8 justify-center flex-nowrap">
            {activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.09 + 0.2 }}
                whileHover={{ scale: 1.05, boxShadow: `0 16px 40px -8px ${activity.color}22` }}
                whileTap={{ scale: 0.98 }}
                className={`relative ${activity.bg} rounded-2xl shadow-xl transition-all cursor-pointer w-72 h-80 flex flex-col items-center border ${activity.border} ${activity.shadow} bg-white`}
                onClick={() => activity.onClick(navigate)}
                style={{ borderTop: `8px solid ${activity.color}` }}
              >
                {/* Small centered circular icon inside card */}
                <div className="flex justify-center w-full">
                  <div className="mt-6 mb-2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border border-[#e6f4ea]">
                    {activity.icon}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-5 w-full">
                  <span className={`text-2xl font-bold ${activity.text} text-center mb-2 mt-2`}>{activity.title}</span>
                  <div className={`${activity.text.replace( 'text-opacity-70 ')} text-lg text-center`}>
                    {activity.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="px-4 mb-8 relative z-10"
      >
        <div className="max-w-xl mx-auto p-7  text-center mb-10">
          <p className="text-[#1b5f52] italic text-xl px-2 font-light">
            "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
          </p>
          <p className="text-[#5e8a87] text-sm mt-3 font-medium">— Noam Shpancer</p>
        </div>
      </motion.div>

      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default Activities;