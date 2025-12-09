import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StarIcon from '@mui/icons-material/Star';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const RecommendationRating = () => {
  const { recommendationId } = useParams();
  const navigate = useNavigate();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadRecommendation = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/recommendation/week`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const byId = Array.isArray(data?.recommendations)
          ? data.recommendations.find((r) => r?._id === recommendationId)
          : null;

        if (byId) {
          setRecommendation(byId);
        } else {
          try {
            const single = await axios.get(
              `${import.meta.env.VITE_NODE_API}/api/recommendation/${recommendationId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setRecommendation(single.data?.recommendation || null);
          } catch {
            setRecommendation(null);
          }
        }
      } catch {
        setRecommendation(null);
      }
      setLoading(false);
    };

    if (recommendationId) loadRecommendation();
  }, [recommendationId]);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/recommendation/feedback`,
        { recommendationId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/recommendation/${recommendationId}/view`, {
        state: {
          recommendation,
          feedback: data?.feedback || { rating, comment },
          sentimentScore: data?.sentimentScore ?? 0,
          combinedScore: data?.combinedScore ?? 0,
          effective: !!data?.effective,
        }
      });
    } catch {
      // stay on page; you could show a toast here
    }
    setSubmitting(false);
  };

  // Helper function to format text: capitalize first letters and remove dashes
  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const ratingEmojis = ['😟', '😐', '🙂', '😊', '🤩'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-8 border-b-2 border-[#CBE7DC] bg-white backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-full hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 text-[#1b5f52] text-3xl font-bold mb-2">
              <span>Rate Effectiveness</span>
            </div>
          </div>

          <div className="w-[52px]"></div>
        </div>
      </div>

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="animate-pulse bg-white rounded-2xl p-8 border-2 border-[#E6F4EA] shadow-sm h-32"
            />
          </div>
        ) : recommendation ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-2xl p-5 border-2 border-[#fbbf24]/30 shadow-sm">
              <div className="flex items-start gap-3">
                <InfoOutlinedIcon style={{ color: '#92400e', fontSize: 24 }} />
                <div>
                  <p className="text-[#92400e] font-semibold text-base mb-1">Rating Window</p>
                  <p className="text-[#78350f] text-sm leading-relaxed">
                    You can rate this recommendation within this week to help us understand what works best for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendation Card */}
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

            {/* Rating Selector */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1">
                  <h3 className="text-[#1b5f52] font-bold text-xl">How effective was this recommendation?</h3>
                  <p className="text-[#6b7280] text-md">Select a rating from 1 (not helpful) to 5 (very helpful)</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = n === rating;
                    return (
                      <motion.button
                        key={n}
                        onClick={() => setRating(n)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                          active
                            ? 'bg-gradient-to-br from-[#55AD9B] to-[#3e8e7e] text-white shadow-lg scale-110'
                            : 'bg-white border-2 border-[#D8EFD3] text-[#55AD9B] hover:border-[#55AD9B]'
                        }`}
                        aria-label={`Rate ${n}`}
                      >
                        {n}
                      </motion.button>
                    );
                  })}
                </div>

                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#F7FBF9] to-[#EAF7F3] border-2 border-[#D8EFD3]"
                  >
                    <span className="text-3xl">{ratingEmojis[rating - 1]}</span>
                    <div>
                      <p className="text-[#1b5f52] font-bold text-lg">{ratingLabels[rating - 1]}</p>
                      <p className="text-[#6b7280] text-sm">You rated this {rating} out of 5</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Comment Box */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="text-[#1b5f52] font-bold text-xl">Share your thoughts</h3>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-[#fbbf24]/10 text-[#92400e] border border-[#fbbf24]/30 text-md font-semibold">
                  Optional
                </span>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full rounded-xl border-2 border-[#E6F4EA] p-4 text-[#272829] text-base bg-[#F7FBF9]/50 focus:outline-none focus:ring-2 focus:ring-[#55AD9B] focus:border-transparent transition-all resize-none"
                placeholder="e.g., This helped me feel more relaxed and focused. Nakatulong talaga siya sa akin!"
              />

              <div className="mt-3 flex items-start gap-2 text-sm text-[#6b7280]">
                <InfoOutlinedIcon style={{ fontSize: 18, color: '#6b7280' }} />
                <p className="leading-relaxed">
                  Comments with at least 10 characters will be analyzed to better understand your experience. 
                  Feel free to write in Filipino, English, or a mix of both!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-[#D8EFD3] bg-white text-[#1b5f52] text-base font-semibold hover:bg-[#F7FBF9] transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !rating}
                className={`w-full sm:w-auto px-8 py-3 rounded-full text-base font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  submitting || !rating
                    ? 'bg-[#94A3B8] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:shadow-lg'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <SendIcon style={{ fontSize: 20 }} />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Note */}
            <div className="text-center">
              <p className="text-[#6b7280] text-md leading-relaxed">
                Your feedback helps us understand what works best for you and helps improve future recommendations.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-[#D8EFD3] p-12 text-center"
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center mx-auto mb-6 border-2 border-[#55AD9B]/30">
              <InfoOutlinedIcon style={{ fontSize: 48, color: '#55AD9B' }} />
            </div>
            <h3 className="text-2xl font-bold text-[#1b5f52] mb-4">Recommendation Not Found</h3>
            <p className="text-[#6b7280] text-base mb-6 max-w-md mx-auto">
              We couldn't find this recommendation. It may have been removed or is no longer available.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Go Back
            </button>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default RecommendationRating;