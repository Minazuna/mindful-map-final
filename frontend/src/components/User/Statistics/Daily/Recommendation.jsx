import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const Recommendation = () => {
  const { moodScoreId } = useParams();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);

      if (!moodScoreId) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/recommendation/generate`,
          { moodScoreId }, // backend returns { recommendations: [...] } (up to 3)
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const recs = Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
        setRecommendations(recs);
      } catch {
        setRecommendations([]);
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, [moodScoreId]);

  const items = Array.isArray(recommendations) ? recommendations : [];
  const primaryGradient = 'linear-gradient(135deg, #D8EFD3 0%, #74c89e 45%, #55AD9B 100%)';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: primaryGradient }}
    >
      {/* Top bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mt-6 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-full bg-white/70 text-[#1b5f52] font-semibold shadow hover:bg-white transition flex items-center gap-2 backdrop-blur"
          aria-label="Back"
          title="Back"
        >
          <ArrowBackIcon style={{ fontSize: 20 }} />
          Back
        </button>

        <div className="flex items-center gap-2 text-white/90">
          <LocalFireDepartmentIcon style={{ fontSize: 22 }} />
          <span className="text-sm">Daily Growth</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-3xl">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 blur-2xl opacity-40 rounded-[36px]" style={{ background: '#95D2B3' }} />

        <div className="bg-white rounded-[32px] shadow-xl border border-[#E8F5E9] p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#55AD9B] to-[#95D2B3] shadow">
                <EmojiObjectsIcon style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b5f52]">
                  Personalized Recommendations
                </h2>
                <p className="text-[#3e8e7e] text-sm md:text-base">
                  “Small steps each day lead to big changes over time.”
                </p>
              </div>
            </div>

            {/* Fun badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-[#F1F8E8] text-[#2f6c60] border border-[#D8EFD3]">
              <CelebrationIcon style={{ fontSize: 18 }} />
              <span className="text-sm font-semibold">Your daily boost</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 border-t border-[#E6F4EA]" />

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gradient-to-r from-[#F7FBF4] to-[#EDF7F0] rounded-2xl p-5 border border-[#E6F4EA]">
                  <div className="h-4 w-2/3 bg-[#DDEFE3] rounded mb-2" />
                  <div className="h-4 w-1/2 bg-[#E6F4EA] rounded" />
                </div>
              ))}
            </div>
          ) : !moodScoreId ? (
            <div className="flex flex-col items-center text-[#2b3b36] mt-8 text-center">
              <div className="h-14 w-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-3">
                <SentimentSatisfiedAltIcon style={{ fontSize: 28, color: '#55AD9B' }} />
              </div>
              <span className="text-base md:text-lg">
                No mood score selected. Go to Daily Analysis and use “View Recommendation” on a specific entry.
              </span>
              <button
                className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] text-white font-semibold shadow hover:opacity-90 transition"
                onClick={() => navigate('/daily-anova')}
              >
                Go to Daily Analysis
              </button>
            </div>
          ) : items.length > 0 ? (
            <div className="mt-6 space-y-4">
              {items.map((item, idx) => {
                const text = typeof item === 'string' ? item : item?.recommendation;
                const key = (typeof item === 'object' && item?._id) || `rec-${idx}`;
                const recommendationId = typeof item === 'object' ? item?._id : null;

                // Show "Update effectiveness" if this recommendation already has feedback(s)
                const hasExistingFeedback =
                  typeof item?.effectivenessCount === 'number' && item.effectivenessCount > 0;

                const statusChip =
                  typeof item?.effective === 'boolean' ? (
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded-full border ${
                        item.effective
                          ? 'bg-[#F1F8E8] border-[#D8EFD3] text-[#2f6c60]'
                          : 'bg-[#FFF7ED] border-[#FDE68A] text-[#92400E]'
                      }`}
                    >
                      {item.effective ? 'Effective' : 'Not effective'}
                    </span>
                  ) : null;

                return (
                  <div
                    key={key}
                    className="group flex items-start gap-4 rounded-2xl p-5 text-[#1f2a27] border border-[#E6F4EA] bg-white hover:bg-gradient-to-r hover:from-[#F1F8E8] hover:to-[#E6F4EA] transition shadow-sm"
                  >
                    <div className="mt-0.5 h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#55AD9B] to-[#95D2B3] shadow-sm group-hover:scale-105 transition">
                      <CheckCircleIcon style={{ color: '#fff' }} />
                    </div>

                    <div className="flex-1">
                      <p className="text-base md:text-lg leading-relaxed">
                        {text}
                        {statusChip}
                      </p>

                      {/* Rate/Update effectiveness CTA */}
                      {recommendationId && (
                        <div className="mt-3">
                          <button
                            onClick={() =>
                              navigate(
                                hasExistingFeedback
                                  ? `/recommendation/${recommendationId}/edit`
                                  : `/recommendation/${recommendationId}/rate`
                              )
                            }
                            className="px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow transition bg-[#1b5f52] hover:opacity-90"
                          >
                            {hasExistingFeedback ? 'Update effectiveness' : 'Rate effectiveness'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Friendly strip */}
              <div className="mt-6 flex items-center justify-between bg-[#F7FBF4] border border-[#E6F4EA] rounded-2xl p-4">
                <div className="text-[#2f6c60]">
                  <p className="font-semibold">Stay consistent</p>
                  <p className="text-sm">Try one recommendation today and note how you feel after.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[#2b3b36] mt-8">
              <div className="h-14 w-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-3">
                <SentimentSatisfiedAltIcon style={{ fontSize: 28, color: '#55AD9B' }} />
              </div>
              <span className="text-base md:text-lg">No recommendation found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom flair */}
      <div className="mt-8 mb-6 flex items-center gap-2 text-white/80">
        <span className="text-mg">Designed for mindfulness</span>
        <span className="text-mg">•</span>
        <span className="text-mg">Built for daily progress</span>
      </div>
    </div>
  );
};

export default Recommendation;