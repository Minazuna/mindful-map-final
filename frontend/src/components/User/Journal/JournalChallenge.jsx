import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlagIcon from '@mui/icons-material/Flag';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CreateIcon from '@mui/icons-material/Create';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CHALLENGES = [
  {
    key: "gratitude",
    title: "Gratitude",
    description: "Reflect on and list things you are thankful for today.",
    icon: <FavoriteBorderIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#b7e4c7] to-[#95d5b2]",
    border: "border-[#B7E4C7]",
  },
  {
    key: "goal",
    title: "Goal Setting",
    description: "Set a meaningful goal you want to achieve soon.",
    icon: <FlagIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#ffd6e0] to-[#ffb3c6]",
    border: "border-[#FFD6E0]",
  },
  {
    key: "reflection",
    title: "Self Reflection",
    description: "Look back on your experiences and what you learned.",
    icon: <PsychologyIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#bdb2ff] to-[#a0c4ff]",
    border: "border-[#BDB2FF]",
  },
  {
    key: "affirmation",
    title: "Positive Affirmation",
    description: "Write a positive statement to encourage yourself.",
    icon: <CheckCircleOutlineIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#ffe066] to-[#ffd60a]",
    border: "border-[#FFE066]",
  },
  {
    key: "highlight",
    title: "Daily Highlights",
    description: "Share the best moments of your day.",
    icon: <HighlightAltIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#90e0ef] to-[#48cae4]",
    border: "border-[#90E0EF]",
  },
  {
    key: "problem",
    title: "Problem Solving",
    description: "Describe a challenge you faced and how you handled it.",
    icon: <BugReportIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#f8bbd0] to-[#f48fb1]",
    border: "border-[#F8BBD0]",
  },
  {
    key: "free",
    title: "Free Write",
    description: "Express anything on your mind, no prompt needed.",
    icon: <CreateIcon fontSize="inherit" />,
    iconBg: "bg-gradient-to-br from-[#b2f7ef] to-[#a7ffeb]",
    border: "border-[#B2F7EF]",
  },
];

export default function JournalChallenge({ onSelect }) {
  const navigate = useNavigate();

  const handleStart = (challenge) => {
    if (onSelect) onSelect(challenge);
    const payload = {
      key: challenge.key,
      title: challenge.title,
      description: challenge.description,
    };
    navigate('/create-journal-entry', { state: { challenge: payload } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f4ea] via-[#f1f8e8] to-[#eaf7f3] relative">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
        <div className="absolute top-24 left-24 w-40 h-40 bg-[#b7e4c7] rounded-full"></div>
        <div className="absolute bottom-24 right-24 w-28 h-28 bg-[#d8f3dc] rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-[#caffbf] rounded-full"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#CBE7DC] py-4 px-4 flex items-center shadow-sm w-full">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-[#E6F4EA] transition"
          aria-label="Back"
        >
          <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold tracking-tight text-[#1b5f52]">
          Journal Challenges
        </h1>
        <div className="w-8" />
      </div>

      <div className="py-14 px-4 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-[#1b5f52] tracking-tight drop-shadow-sm">
            Choose a Journal Challenge
          </h2>
          <p className="mt-3 text-[#6b7280] max-w-2xl mx-auto text-lg">
            Pick a prompt to guide your journaling — small, meaningful steps add up.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {CHALLENGES.map((challenge, idx) => (
            <motion.div
              key={challenge.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35 }}
              whileHover={{
                scale: 1.055,
                boxShadow: "0 16px 40px 0 rgba(67,97,238,0.12)",
              }}
              className={`relative rounded-3xl overflow-hidden border-2 ${challenge.border} bg-white shadow-lg transition-all cursor-pointer group`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart(challenge); }}
              onClick={() => handleStart(challenge)}
            >
              {/* Decorative top bar */}
              <div className="h-2 bg-gradient-to-r from-[#E6F4EA] via-[#F1F8E8] to-[#EAF7F3] opacity-80"></div>
              <div className="p-8 min-h-[260px] flex flex-col">
                <div className="flex items-center gap-5 mb-2">
                  <div className={`w-16 h-16 rounded-2xl ${challenge.iconBg} flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform`}>
                    {challenge.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#1b5f52]">{challenge.title}</h3>
                    <div className="text-xs text-[#48bfe3] font-semibold mt-1 tracking-wide uppercase">Daily Prompt</div>
                  </div>
                </div>
                <p className="text-[#272829] mt-4 flex-1 leading-relaxed text-base">
                  {challenge.description}
                </p>
                <div className="mt-7 flex items-center justify-between">
                  <button
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:from-[#3e8e7e] hover:to-[#55AD9B] text-white rounded-full font-semibold shadow-lg transition-all duration-150 text-base"
                    aria-label={`Start ${challenge.title} challenge`}
                    tabIndex={-1}
                  >
                    Start
                  </button>
                </div>
              </div>
              {/* Decorative footer */}
              <div className="h-8 bg-gradient-to-r from-white to-[#EAF7F3] opacity-70"></div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-base text-[#6b7280]">
          <span className="inline-block px-4 py-2 bg-[#E6F4EA] rounded-full font-medium shadow-sm">
            Tip: Try a different prompt each day to build a richer habit.
          </span>
        </div>
      </div>
    </div>
  );
}