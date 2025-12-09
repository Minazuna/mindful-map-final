import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const EditRecommendation = () => {
  const { recommendationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moodScoreId, setMoodScoreId] = useState(location.state?.moodScoreId ?? null);

  // Editable fields (pre-filled)
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Last saved analysis (pre-filled if available)
  const [sentimentScore, setSentimentScore] = useState(0);
  const [combinedScore, setCombinedScore] = useState(0);
  const [effective, setEffective] = useState(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    const load = async () => {
      if (!recommendationId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // If moodScoreId not passed via navigation state, resolve via weekly list
        if (!moodScoreId) {
          const weekRes = await axios.get(
            `${import.meta.env.VITE_NODE_API}/api/recommendation/week`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const weekItems = Array.isArray(weekRes.data?.recommendations) ? weekRes.data.recommendations : [];
          const rec = weekItems.find(r => String(r?._id) === String(recommendationId));
          if (rec?.moodScore) setMoodScoreId(rec.moodScore);
        }

        // Fetch existing feedback for this recommendation (current user)
        const fbRes = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/recommendation/feedback/${recommendationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const fb = fbRes.data?.feedback;

        if (fb) {
          setRating(Number(fb.rating || 0));
          setComment(String(fb.comment || ''));
          setSentimentScore(typeof fb.sentimentScore === 'number' ? fb.sentimentScore : 0);
          setCombinedScore(typeof fb.combinedScore === 'number' ? fb.combinedScore : 0);
          setEffective(typeof fb.effective === 'boolean' ? fb.effective : null);
        } else {
          setRating(0);
          setComment('');
          setSentimentScore(0);
          setCombinedScore(0);
          setEffective(null);
        }
      } catch (_) {
        setRating(0);
        setComment('');
        setSentimentScore(0);
        setCombinedScore(0);
        setEffective(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recommendationId, token, moodScoreId]);

const handleSave = async () => {
    if (!recommendationId || !rating) return;
    setSaving(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/recommendation/feedback`,
        { recommendationId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fb = res.data?.feedback;
      let updatedSentiment = sentimentScore;
      let updatedCombined = combinedScore;
      let updatedEffective = effective;

      if (fb) {
        updatedSentiment = typeof fb.sentimentScore === 'number' ? fb.sentimentScore : 0;
        updatedCombined = typeof fb.combinedScore === 'number' ? fb.combinedScore : 0;
        updatedEffective = typeof fb.effective === 'boolean' ? fb.effective : null;
        
        setSentimentScore(updatedSentiment);
        setCombinedScore(updatedCombined);
        setEffective(updatedEffective);
      }

      // Try to fetch the recommendation details, if it fails use basic info
      let recommendation = null;
      try {
        const recRes = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/recommendation/${recommendationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        recommendation = recRes.data?.recommendation || null;
      } catch (error) {
        console.error('Could not fetch recommendation details:', error);
        // If fetch fails, try to get it from the weekly list
        try {
          const weekRes = await axios.get(
            `${import.meta.env.VITE_NODE_API}/api/recommendation/week`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const weekItems = Array.isArray(weekRes.data?.recommendations) ? weekRes.data.recommendations : [];
          recommendation = weekItems.find(r => String(r?._id) === String(recommendationId)) || null;
        } catch (weekError) {
          console.error('Could not fetch from weekly list:', weekError);
        }
      }

      // Redirect to ViewRecommendation page with state
      navigate(`/recommendation/${recommendationId}/view`, {
        state: {
          recommendation,
          feedback: { rating, comment },
          sentimentScore: updatedSentiment,
          combinedScore: updatedCombined,
          effective: updatedEffective,
        }
      });
    } catch (_) {
      // Optional: show toast
    } finally {
      setSaving(false);
    }
  };

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const ratingEmojis = ['😟', '😐', '🙂', '😊', '🤩'];
  const scorePct = Math.round(Math.max(0, Math.min(1, combinedScore)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] via-[#95D2B3] to-[#EAF7F3]">
      {/* Header */}
      <div className="py-8 border-b-2 border-[#CBE7DC] bg-white backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => (moodScoreId ? navigate(`/recommendation/${moodScoreId}`) : navigate(-1))}
            className="p-3 rounded-full hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-300"
            aria-label="Back"
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 text-[#1b5f52] text-3xl font-bold mb-2">
              <span>Update Recommendation's Effectiveness</span>
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
        ) : (
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
                  <p className="text-[#92400e] font-semibold text-base mb-1">Update Your Feedback</p>
                  <p className="text-[#78350f] text-sm leading-relaxed">
                    Your previous rating and comments are loaded below. Make changes and save to update your feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Analysis Stats */}
            {(sentimentScore !== 0 || combinedScore !== 0 || effective !== null) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-[#D8EFD3]">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUpIcon style={{ color: '#55AD9B', fontSize: 24 }} />
                  <h3 className="text-[#1b5f52] font-bold text-xl">Current Analysis</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-[#E6F4EA]">
                    <p className="text-sm text-[#6b7280] mb-1">Sentiment Score</p>
                    <p className="text-2xl font-bold text-[#1b5f52]">
                      {Number.isFinite(sentimentScore) ? sentimentScore.toFixed(3) : '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#E6F4EA]">
                    <p className="text-sm text-[#6b7280] mb-1">Combined Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-[#1b5f52]">{scorePct}%</p>
                      <div className="flex-1 bg-[#E6F4EA] rounded-full h-2">
                        <div 
                          className="h-full bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] rounded-full transition-all duration-500"
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#E6F4EA]">
                    <p className="text-sm text-[#6b7280] mb-1">Effectiveness</p>
                    <p className={`text-2xl font-bold ${effective ? 'text-[#1b5f52]' : 'text-[#92400e]'}`}>
                      {effective === null ? '—' : effective ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rating Selector */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#D8EFD3] shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1">
                  <h3 className="text-[#1b5f52] font-bold text-xl">Update your rating</h3>
                  <p className="text-[#6b7280] text-sm">Select a rating from 1 (not helpful) to 5 (very helpful)</p>
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
                  <h3 className="text-[#1b5f52] font-bold text-xl">Update your thoughts</h3>
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
                onClick={() => (moodScoreId ? navigate(`/recommendation/${moodScoreId}`) : navigate(-1))}
                className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-[#D8EFD3] bg-white text-[#1b5f52] text-base font-semibold hover:bg-[#F7FBF9] transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !rating}
                className={`w-full sm:w-auto px-8 py-3 rounded-full text-base font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  saving || !rating
                    ? 'bg-[#94A3B8] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:shadow-lg'
                }`}
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

            {/* Bottom Note */}
            <div className="text-center">
              <p className="text-[#6b7280] text-md leading-relaxed">
                Your updated feedback helps us continuously improve your recommendations.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EditRecommendation;