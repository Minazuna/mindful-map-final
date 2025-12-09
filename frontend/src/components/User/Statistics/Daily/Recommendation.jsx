import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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
          { moodScoreId },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#F7FBF9] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-8 border-b-2 border-[#CBE7DC] bg-gradient-to-r from-white/50 to-[#F7FBF9]/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-full hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 text-[#1b5f52] text-3xl font-bold mb-2">
              <span>Personalized Recommendations</span>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="animate-pulse bg-white rounded-2xl p-6 border-2 border-[#E6F4EA] shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#E6F4EA]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-[#E6F4EA] rounded" />
                    <div className="h-5 w-1/2 bg-[#F7FBF9] rounded" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : !moodScoreId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-[#D8EFD3] p-12 text-center"
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center mx-auto mb-6 border-2 border-[#55AD9B]/30">
              <SentimentSatisfiedAltIcon style={{ fontSize: 48, color: '#55AD9B' }} />
            </div>
            <h3 className="text-2xl font-bold text-[#1b5f52] mb-4">No Mood Score Selected</h3>
            <p className="text-[#6b7280] text-base mb-6 max-w-md mx-auto leading-relaxed">
              Go to Daily Analysis and use "View Tips" on a specific entry to get personalized recommendations.
            </p>
            <button
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => navigate('/daily-anova')}
            >
              Go to Daily Analysis
            </button>
          </motion.div>
        ) : items.length > 0 ? (
          <>
            {/* Stats Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] rounded-2xl p-7 shadow-lg mb-8 text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                    <AutoAwesomeIcon style={{ fontSize: 28 }} />
                  </div>
                  <div>
                    <p className="font-bold text-xl">Your Growth Plan</p>
                    <p className="text-white/90 text-base">{items.length} personalized {items.length === 1 ? 'tip' : 'tips'} ready for you</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recommendations List */}
            <div className="space-y-5 mb-8">
              <AnimatePresence>
                {items.map((item, idx) => {
                  const text = typeof item === 'string' ? item : item?.recommendation;
                  const key = (typeof item === 'object' && item?._id) || `rec-${idx}`;
                  const recommendationId = typeof item === 'object' ? item?._id : null;
                  const hasExistingFeedback =
                    typeof item?.effectivenessCount === 'number' && item.effectivenessCount > 0;

                  // Only show status chip if there's existing feedback
                  const statusChip =
                    hasExistingFeedback && typeof item?.effective === 'boolean' ? (
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full font-semibold ${
                          item.effective
                            ? 'bg-[#55AD9B]/10 text-[#1b5f52] border border-[#55AD9B]/30'
                            : 'bg-[#FF9800]/10 text-[#92400e] border border-[#FF9800]/30'
                        }`}
                      >
                        {item.effective ? '✓ Effective' : '✗ Not effective'}
                      </span>
                    ) : null;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                      className="group relative bg-white rounded-2xl border-2 border-[#E6F4EA] shadow-sm hover:shadow-lg hover:border-[#55AD9B]/30 transition-all duration-300 overflow-hidden"
                    >
                      {/* Number badge */}
                      <div className="absolute top-5 left-5 h-10 w-10 rounded-full bg-gradient-to-br from-[#55AD9B] to-[#3e8e7e] flex items-center justify-center text-white font-bold text-base shadow-md">
                        {idx + 1}
                      </div>

                      <div className="flex items-start gap-4 p-7 pl-20">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <p className="text-lg leading-relaxed text-[#272829] flex-1">{text}</p>
                            {statusChip && <div className="flex-shrink-0">{statusChip}</div>}
                          </div>

                          {/* Rate/Update effectiveness CTA */}
                          {recommendationId && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-[#F7FBF9]">
                              <button
                                onClick={() =>
                                  navigate(
                                    hasExistingFeedback
                                      ? `/recommendation/${recommendationId}/edit`
                                      : `/recommendation/${recommendationId}/rate`
                                  )
                                }
                                className="px-5 py-2.5 rounded-full text-white text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e]"
                              >
                                {hasExistingFeedback ? 'Update Effectiveness' : 'Rate Effectiveness'}
                              </button>
                              <span className="text-sm text-[#6b7280] italic">
                                Help us improve your recommendations
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Decorative icon */}
                        <div className="hidden md:flex h-12 w-12 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircleIcon style={{ color: '#55AD9B', fontSize: 26 }} />
                        </div>
                      </div>

                      {/* Hover effect gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#F7FBF9]/0 to-[#EAF7F3]/0 group-hover:from-[#F7FBF9]/50 group-hover:to-[#EAF7F3]/30 transition-all duration-300 pointer-events-none" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Motivational Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-2xl p-7 border-2 border-[#fbbf24]/30 shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                  <CelebrationIcon style={{ color: '#92400e', fontSize: 28 }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#92400e] text-xl mb-2">Stay Consistent!</h4>
                  <p className="text-[#78350f] text-base leading-relaxed">
                    Try one recommendation today and take note of how you feel afterward. Small, consistent actions create lasting change. You've got this! 
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-[#D8EFD3] p-12 text-center"
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center mx-auto mb-6 border-2 border-[#55AD9B]/30">
              <SentimentSatisfiedAltIcon style={{ fontSize: 48, color: '#55AD9B' }} />
            </div>
            <h3 className="text-2xl font-bold text-[#1b5f52] mb-4">No Recommendations Available</h3>
            <p className="text-[#6b7280] text-base max-w-md mx-auto leading-relaxed">
              We couldn't generate recommendations for this entry. Try logging more activities to get personalized insights.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="py-6 border-t-2 border-[#CBE7DC] bg-gradient-to-r from-white/50 to-[#F7FBF9]/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-3 text-[#6b7280] text-base">
          <span>Designed for mindfulness</span>
          <span>•</span>
          <span>Built for daily progress</span>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;