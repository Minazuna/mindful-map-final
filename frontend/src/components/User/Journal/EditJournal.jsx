import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlagIcon from '@mui/icons-material/Flag';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CreateIcon from '@mui/icons-material/Create';
import BottomNav from '../../BottomNav';

// Challenge definitions (same as in CreateJournalEntry)
const CHALLENGES = [
  {
    key: "gratitude",
    title: "Gratitude",
    description: "Reflect on and list things you are thankful for today.",
    icon: <FavoriteBorderIcon fontSize="inherit" />,
    suggestions: [
      "I'm grateful for...",
      "Today I appreciated...",
      "A small thing that made me smile was...",
    ],
  },
  {
    key: "goal",
    title: "Goal Setting",
    description: "Set a meaningful goal you want to achieve soon.",
    icon: <FlagIcon fontSize="inherit" />,
    suggestions: [
      "My goal for today is...",
      "One thing I want to accomplish is...",
      "Steps I can take to reach my goal...",
    ],
  },
  {
    key: "reflection",
    title: "Self Reflection",
    description: "Look back on your experiences and what you learned.",
    icon: <PsychologyIcon fontSize="inherit" />,
    suggestions: [
      "Today I learned...",
      "I noticed that...",
      "Something I could improve on is...",
    ],
  },
  {
    key: "affirmation",
    title: "Positive Affirmation",
    description: "Write a positive statement to encourage yourself.",
    icon: <CheckCircleOutlineIcon fontSize="inherit" />,
    suggestions: [
      "I am capable of...",
      "I believe in myself because...",
      "Today I will remind myself...",
    ],
  },
  {
    key: "highlight",
    title: "Daily Highlights",
    description: "Share the best moments of your day.",
    icon: <HighlightAltIcon fontSize="inherit" />,
    suggestions: [
      "The best part of my day was...",
      "A moment that made me happy was...",
      "Something unexpected and good happened...",
    ],
  },
  {
    key: "problem",
    title: "Problem Solving",
    description: "Describe a challenge you faced and how you handled it.",
    icon: <BugReportIcon fontSize="inherit" />,
    suggestions: [
      "A challenge I faced today was...",
      "I handled it by...",
      "Next time, I might try...",
    ],
  },
  {
    key: "free",
    title: "Free Write",
    description: "Express anything on your mind, no prompt needed.",
    icon: <CreateIcon fontSize="inherit" />,
    suggestions: [
      "Today I feel...",
      "What's on my mind is...",
      "I want to talk about...",
    ],
  },
];

function getChallengeObjByTitle(title) {
  // Try to match by title (case-insensitive)
  return (
    CHALLENGES.find(
      (c) => c.title.toLowerCase() === title.toLowerCase()
    ) || null
  );
}

const EditJournal = () => {
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeObj, setChallengeObj] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch previous journal entry data
  useEffect(() => {
    const fetchJournalEntry = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/entry/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const entry = response.data.entry;
        // Use the first challenge as the type (since only one type is allowed)
        const firstChallenge = Array.isArray(entry.challenges) && entry.challenges.length > 0
          ? entry.challenges[0]
          : '';
        setChallengeTitle(firstChallenge);
        setChallengeObj(getChallengeObjByTitle(firstChallenge));
        setContent(entry.content || '');
      } catch (err) {
        setError('Failed to load journal entry.');
      } finally {
        setLoading(false);
      }
    };
    fetchJournalEntry();
  }, [id]);

  // Handle suggestion bubble click
  const handleSuggestionClick = (suggestion) => {
    setContent((prev) =>
      prev
        ? prev.trim().endsWith(".")
          ? prev + " " + suggestion
          : prev + ". " + suggestion
        : suggestion
    );
  };

  // Save updated journal entry
  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_NODE_API}/api/journal/${id}`,
        {
          challenges: [challengeTitle],
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate(`/view-journal/${id}`);
    } catch (err) {
      setError('Failed to update journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    navigate('/journal-logs');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-8 border-b-2 border-[#CBE7DC] bg-white backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="p-3 rounded-full hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 text-[#1b5f52] text-3xl font-bold mb-2">
            </div>
            <div className="text-[#40916c] font-semibold">{currentDate}</div>
          </div>
          <div className="w-[52px]"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-7"
        >
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-2xl p-5 border-2 border-[#fbbf24]/30 shadow-sm">
            <div className="flex items-start gap-3">
              <InfoOutlinedIcon style={{ color: '#92400e', fontSize: 24 }} />
              <div>
                <p className="text-[#92400e] font-semibold text-base mb-1">Edit Your Journal Entry</p>
                <p className="text-[#78350f] text-sm leading-relaxed">
                  Update your journal content below. You cannot change the challenge type.
                </p>
              </div>
            </div>
          </div>

          {/* Challenge Info Card */}
          {challengeObj && (
            <div className="bg-white rounded-2xl p-7 border-2 border-[#D8EFD3] shadow-md flex items-start gap-5">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-4xl">
                {challengeObj.icon}
              </div>
              <div>
                <h3 className="text-[#1b5f52] font-bold text-xl mb-1">{challengeObj.title}</h3>
                <p className="text-[#272829] text-base">{challengeObj.description}</p>
              </div>
            </div>
          )}

          {/* Suggestion Bubbles */}
          {challengeObj && challengeObj.suggestions && (
            <div>
              <div className="mb-2 text-[#1b5f52] font-semibold text-md">Suggestions</div>
              <div className="flex flex-wrap gap-2">
                {challengeObj.suggestions.map((suggestion, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#F1F8E8] to-[#EAF7F3] border border-[#D8EFD3] text-[#3e8e7e] text-md hover:bg-[#EAF7F3] transition"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Journal Content */}
          <div>
            <label className="block font-semibold mb-2 text-[#1b5f52] text-md">
              Journal Content
            </label>
            <textarea
              className="w-full rounded-xl border-2 border-[#E6F4EA] p-4 text-[#272829] text-md bg-[#F7FBF9]/50 focus:outline-none focus:ring-2 focus:ring-[#55AD9B] focus:border-transparent transition-all resize-none min-h-[120px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
            />
            <div className="mt-2 flex items-start gap-2 text-sm text-[#6b7280]">
              <InfoOutlinedIcon style={{ fontSize: 18, color: "#6b7280" }} />
              <span>
                You can use the suggestions above or write anything that comes to mind.
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#ffeded] border border-[#ff5252]/30 text-[#ff5252] rounded-xl px-6 py-3 text-center font-semibold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
            <button
              onClick={handleBackClick}
              className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-[#D8EFD3] bg-white text-[#1b5f52] text-base font-semibold hover:bg-[#F7FBF9] transition-all duration-300"
              type="button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto px-8 py-3 rounded-full text-base font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                saving
                  ? 'bg-[#94A3B8] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:shadow-lg'
              }`}
              type="button"
            >
              {saving ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon style={{ fontSize: 20 }} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      <BottomNav value="journal" setValue={() => {}} />
    </div>
  );
};

export default EditJournal;