import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const ViewRecommendation = () => {
  const { recommendationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [recommendation, setRecommendation] = useState(location.state?.recommendation || null);
  const [feedback, setFeedback] = useState(location.state?.feedback || null);
  const [combinedScore, setCombinedScore] = useState(location.state?.combinedScore ?? 0);
  const [effective, setEffective] = useState(!!location.state?.effective);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRec() {
      if (!recommendation) {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
          const { data } = await axios.get(
            `${import.meta.env.VITE_NODE_API}/api/recommendation/${recommendationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setRecommendation(data?.recommendation || null);
        } catch {
          setRecommendation(null);
        }
        setLoading(false);
      }
    }
    fetchRec();
  }, [recommendationId, recommendation]);

  // If feedback exists but wasn’t passed in via navigation state, keep combined/effective in sync where possible
  useEffect(() => {
    if (feedback) {
      if (typeof feedback.combinedScore === 'number') setCombinedScore(feedback.combinedScore);
      if (typeof feedback.effective === 'boolean') setEffective(feedback.effective);
    }
  }, [feedback]);

  // Sentiment label (VADER-style thresholds) derived from numeric sentimentScore stored in feedback/state
  const rawSentimentScore =
    location.state?.sentimentScore ?? feedback?.sentimentScore ?? feedback?.scores?.combined ?? 0;

  const sentimentLabel = useMemo(() => {
    const s = Number(rawSentimentScore);
    if (Number.isNaN(s)) return 'Neutral';
    if (s >= 0.05) return 'Positive';
    if (s <= -0.05) return 'Negative';
    return 'Neutral';
  }, [rawSentimentScore]);

  // Helper function to format text: capitalize first letters and remove dashes
  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const scorePct = Math.round(Math.max(0, Math.min(1, combinedScore)) * 100);
  const ratingEmojis = ['😟', '😐', '🙂', '😊', '🤩'];
  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="animate-pulse bg-white rounded-2xl p-8 border-2 border-[#E6F4EA] shadow-sm"
            >
              <div className="h-6 w-3/4 bg-[#E6F4EA] rounded mb-4" />
              <div className="h-6 w-1/2 bg-[#F7FBF9] rounded" />
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] rounded-2xl p-7 shadow-lg text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <CheckCircleIcon style={{ fontSize: 28 }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1">Feedback Submitted Successfully!</h3>
                  <p className="text-white/90 text-base">Your input helps us improve your experience</p>
                </div>
              </div>
            </div>

            {/* Recommendation Card */}
            {recommendation && (
              <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center border-2 border-[#55AD9B]/30">
                    <StarIcon style={{ color: '#55AD9B', fontSize: 26 }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#1b5f52] font-bold text-xl mb-2">Your Recommendation</h3>
                    <p className="text-[#272829] text-lg leading-relaxed">{recommendation.recommendation}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#55AD9B]/10 text-[#1b5f52] border border-[#55AD9B]/30 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#55AD9B]"></span>
                    {formatText(recommendation.category)}
                  </span>
                  {recommendation.activity && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#95D2B3]/10 text-[#1b5f52] border border-[#95D2B3]/30 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#95D2B3]"></span>
                      {formatText(recommendation.activity)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Rating and Effectiveness Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Your Rating */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#D8EFD3] shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[#1b5f52] font-bold text-lg">Your Rating</h3>
                </div>

                {feedback?.rating ? (
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{ratingEmojis[feedback.rating - 1]}</div>
                    <div>
                      <div className="text-4xl font-bold text-[#55AD9B]">{feedback.rating}</div>
                      <div className="text-sm text-[#6b7280]">out of 5</div>
                      <div className="text-base font-semibold text-[#1b5f52] mt-1">
                        {ratingLabels[feedback.rating - 1]}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#6b7280]">No rating provided</div>
                )}
              </div>

              {/* Effectiveness */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#D8EFD3] shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[#1b5f52] font-bold text-lg">Effectiveness</h3>
                </div>

                <div className="space-y-4">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold ${
                      effective
                        ? 'bg-[#55AD9B]/10 text-[#1b5f52] border-2 border-[#55AD9B]/30'
                        : 'bg-[#FF9800]/10 text-[#92400e] border-2 border-[#FF9800]/30'
                    }`}
                  >
                    {effective ? '✓ Effective' : '✗ Needs Improvement'}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6b7280]">Combined Score</span>
                      <span className="font-bold text-[#1b5f52]">{scorePct}%</span>
                    </div>
                    <div className="w-full bg-[#E6F4EA] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] rounded-full transition-all duration-500"
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                    <EmojiEmotionsIcon style={{ fontSize: 18 }} />
                    <span>Sentiment Analysis: {sentimentLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment */}
            {feedback?.comment && (
              <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[#1b5f52] font-bold text-lg">Your Thoughts</h3>
                </div>
                <p className="text-[#272829] text-base leading-relaxed">{feedback.comment}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/mood-habit-analysis')}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Back to Daily Analysis
              </button>
              <button
                onClick={() => navigate(-2)}
                className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#D8EFD3] bg-white text-[#1b5f52] text-base font-semibold hover:bg-[#F7FBF9] transition-all duration-300"
              >
                View Recommendations
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ViewRecommendation;