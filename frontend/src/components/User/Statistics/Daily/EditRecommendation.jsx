import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import MoodIcon from '@mui/icons-material/Mood';
import RateReviewIcon from '@mui/icons-material/RateReview';

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
      if (fb) {
        setSentimentScore(typeof fb.sentimentScore === 'number' ? fb.sentimentScore : 0);
        setCombinedScore(typeof fb.combinedScore === 'number' ? fb.combinedScore : 0);
        setEffective(typeof fb.effective === 'boolean' ? fb.effective : null);
      }

      // Redirect back to the recommendations list for this mood score
      if (moodScoreId) {
        navigate(`/recommendation/${moodScoreId}`);
      } else {
        navigate(-1);
      }
    } catch (_) {
      // Optional: show toast
    } finally {
      setSaving(false);
    }
  };

  const ratingLabels = ['1', '2', '3', '4', '5'];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ background: 'linear-gradient(135deg, #D8EFD3 0%, #74c89e 45%, #55AD9B 100%)' }}>
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button
          onClick={() => (moodScoreId ? navigate(`/recommendation/${moodScoreId}`) : navigate(-1))}
          className="px-4 py-2 rounded-full bg-white/70 text-[#1b5f52] font-semibold shadow hover:bg-white transition flex items-center gap-2 backdrop-blur"
        >
          <ArrowBackIcon style={{ fontSize: 20 }} />
          Back
        </button>
        <div className="text-white/90 text-sm flex items-center gap-2">
          <RateReviewIcon />
          Edit effectiveness
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-[28px] shadow-xl border border-[#E8F5E9] p-6">
        <h2 className="text-2xl font-extrabold text-[#1b5f52] mb-2">Update your rating</h2>
        <p className="text-[#3e8e7e] mb-4">Your previous rating and note are loaded below.</p>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-5 w-1/2 bg-[#E6F4EA] rounded mb-3" />
            <div className="h-24 w-full bg-[#F1F8E8] rounded" />
          </div>
        ) : (
          <>
            {/* Rating (1–5) */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2 text-[#1b5f52]">
                <StarIcon style={{ color: '#fbbf24' }} />
                <span className="font-semibold">Rate (1–5)</span>
              </div>
              <div className="flex gap-2">
                {ratingLabels.map((label, i) => {
                  const val = i + 1;
                  const active = rating === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className={`px-3 py-2 rounded-lg border transition flex items-center gap-1 ${
                        active ? 'bg-[#FDE68A] border-[#FBBF24] text-[#92400E]' : 'bg-white border-[#E6F4EA] text-[#1f2a27]'
                      }`}
                      aria-pressed={active}
                    >
                      <StarIcon style={{ fontSize: 18, color: active ? '#f59e0b' : '#9CA3AF' }} />
                      {val}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#6b7280] mt-1">Higher rating means more effective.</p>
            </div>

            {/* Comment (optional, pre-filled if exists) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 text-[#1b5f52]">
                <MoodIcon style={{ color: '#55AD9B' }} />
                <span className="font-semibold">Your note (optional)</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What made this effective (or not)?"
                className="w-full rounded-xl border border-[#E6F4EA] p-3 focus:outline-none focus:ring-2 focus:ring-[#95D2B3] text-[#1f2a27]"
              />
              <p className="text-xs text-[#6b7280] mt-1">
                Text analysis is computed when your note has 10+ characters.
              </p>
            </div>

            {/* Last saved analysis (pre-filled if backend returned it) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-[#F7FBF4] border border-[#E6F4EA] rounded-xl p-3">
                <p className="text-xs text-[#6b7280]">Sentiment score</p>
                <p className="text-lg font-semibold text-[#1b5f52]">
                  {Number.isFinite(sentimentScore) ? sentimentScore.toFixed(3) : '—'}
                </p>
              </div>
              <div className="bg-[#F7FBF4] border border-[#E6F4EA] rounded-xl p-3">
                <p className="text-xs text-[#6b7280]">Combined score</p>
                <p className="text-lg font-semibold text-[#1b5f52]">
                  {Number.isFinite(combinedScore) ? combinedScore.toFixed(3) : '—'}
                </p>
              </div>
              <div className="bg-[#F7FBF4] border border-[#E6F4EA] rounded-xl p-3">
                <p className="text-xs text-[#6b7280]">Effective</p>
                <p className={`text-lg font-semibold ${effective ? 'text-[#2f6c60]' : 'text-[#92400E]'}`}>
                  {effective === null ? '—' : effective ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !rating}
                className={`px-4 py-2 rounded-full text-white font-semibold shadow transition ${
                  saving || !rating ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#1b5f52] hover:opacity-90'
                }`}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => (moodScoreId ? navigate(`/recommendation/${moodScoreId}`) : navigate(-1))}
                className="px-4 py-2 rounded-full bg-white text-[#1b5f52] font-semibold border border-[#E6F4EA] hover:bg-[#F7FBF4] transition"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditRecommendation;