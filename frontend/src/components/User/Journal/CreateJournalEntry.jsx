import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FlagIcon from '@mui/icons-material/Flag';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CreateIcon from '@mui/icons-material/Create';

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

export default function CreateJournalEntry() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get challenge from navigation state (from JournalChallenge)
  const challengeState = location.state?.challenge;
  const initialChallengeKey = challengeState?.key
    ? [challengeState.key]
    : [];

  const [selectedChallenges, setSelectedChallenges] = useState(initialChallengeKey);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Find the first selected challenge for display
  const selectedChallengeObj =
    CHALLENGES.find((c) => c.key === selectedChallenges[0]) || null;

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

  // On mount, if challenge is passed, set it as selected
  useEffect(() => {
    if (challengeState?.key) {
      setSelectedChallenges([challengeState.key]);
    }
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedChallenges.length === 0) {
      setError("Please select at least one challenge.");
      return;
    }
    if (!content.trim()) {
      setError("Please enter your journal content.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/create`,
        {
          challenges: selectedChallenges.map(
            (key) => CHALLENGES.find((c) => c.key === key).title
          ),
          content,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLoading(false);
      // Redirect to view the latest created entry
      navigate(`/view-journal/${data.entry._id}`);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.error || "Failed to create journal entry."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Challenge Info Card */}
        {selectedChallengeObj && (
          <div className="bg-white rounded-2xl p-7 border-2 border-[#D8EFD3] shadow-md mb-8 flex items-start gap-5">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: "linear-gradient(135deg, #F1F8E8 60%, #95D2B3 100%)" }}>
              {selectedChallengeObj.icon}
            </div>
            <div>
              <h3 className="text-[#1b5f52] font-bold text-xl mb-1">{selectedChallengeObj.title}</h3>
              <p className="text-[#272829] text-base">{selectedChallengeObj.description}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Suggestion Bubbles */}
          {selectedChallengeObj && selectedChallengeObj.suggestions && (
            <div>
              <div className="mb-2 text-[#1b5f52] font-semibold">Suggestions</div>
              <div className="flex flex-wrap gap-2">
                {selectedChallengeObj.suggestions.map((suggestion, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#F1F8E8] to-[#EAF7F3] border border-[#D8EFD3] text-[#3e8e7e] font-medium text-sm hover:bg-[#EAF7F3] transition"
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
            <label className="block font-semibold mb-2 text-[#1b5f52]">
              Journal Content
            </label>
            <textarea
              className="w-full rounded-xl border-2 border-[#E6F4EA] p-4 text-[#272829] text-base bg-[#F7FBF9]/50 focus:outline-none focus:ring-2 focus:ring-[#55AD9B] focus:border-transparent transition-all resize-none min-h-[120px]"
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

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm font-medium">{error}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full px-8 py-3 rounded-full text-base font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              loading
                ? "bg-[#94A3B8] cursor-not-allowed"
                : "bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:shadow-lg"
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Entry</span>
            )}
          </button>
        </form>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-[#6b7280] text-md leading-relaxed">
            Journaling regularly helps you reflect, grow, and build a mindful habit.
          </p>
        </div>
      </div>
    </div>
  );
}