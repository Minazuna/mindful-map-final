import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const primaryGradient = 'linear-gradient(135deg, #D8EFD3 0%, #74c89e 45%, #55AD9B 100%)';
const greenDark = '#1b5f52';
const greenMid = '#55AD9B';
const greenSoft = '#3e8e7e';
const accent = '#F59E0B';

const circlePalette = ['#D8EFD3', '#BFE8CF', '#95D2B3', '#74c89e', '#55AD9B'];

const RecommendationRating = () => {
  const { recommendationId } = useParams();
  const navigate = useNavigate();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageBackground = useMemo(() => primaryGradient, []);

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

      // Navigate to a friendly summary view with saved data
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

  const Header = () => (
    <div className="w-full max-w-3xl flex items-center justify-between mt-6 mb-4">
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-full bg-white/70 text-[#1b5f52] font-semibold shadow hover:bg-white transition backdrop-blur"
        aria-label="Back"
        title="Back"
      >
        Back
      </button>
      <div className="flex items-center gap-2 text-white/90">
        <span className="text-sm">Feedback</span>
      </div>
    </div>
  );

  const RecommendationCard = () => (
    <div className="rounded-2xl p-5 border border-[#E6F4EA] bg-white/95 text-[#1f2a27] shadow-sm">
      {recommendation ? (
        <>
          <p className="text-base md:text-lg leading-relaxed">{recommendation.recommendation}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#3e8e7e]">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F7FBF4] border border-[#E6F4EA]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: greenMid }} />
              Category: {recommendation.category}
            </span>
            {recommendation.activity && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F7FBF4] border border-[#E6F4EA]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: greenMid }} />
                Activity: {recommendation.activity}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-[#3e8e7e]">Recommendation details unavailable.</p>
      )}
    </div>
  );

  const RatingSelector = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <label className="text-sm text-[#3e8e7e]">Your rating</label>
        <span className="text-xs text-[#3e8e7e]">Scale 1–5</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        {[1, 2, 3, 4, 5].map((n, i) => {
          const active = n === rating;
          const baseColor = circlePalette[i % circlePalette.length];
          return (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="h-12 w-12 rounded-2xl flex items-center justify-center transition"
              style={{
                background: active ? baseColor : '#FFFFFF',
                border: `2px solid ${active ? baseColor : '#D8EFD3'}`,
                boxShadow: active ? '0 10px 24px rgba(0,0,0,0.12)' : 'none'
              }}
              aria-label={`Rate ${n}`}
              title={`Rate ${n}`}
            >
              <span className="text-sm font-bold" style={{ color: active ? greenDark : '#3e8e7e' }}>
                {n}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-[#3e8e7e]">Select one from 1 (low) to 5 (high)</div>
    </div>
  );

  const CommentBox = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <label className="text-sm text-[#3e8e7e]">Your thoughts</label>
        <span className="text-xs inline-flex items-center gap-1 text-[#6b7280]">
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#E6F4EA] bg-[#F7FBF4]">
            Optional text analysis
          </span>
          <span className="text-[#9CA3AF]">Add a short comment to improve accuracy</span>
        </span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-[#E6F4EA] p-4 text-[#1f2a27] bg-[#F7FBF4] focus:outline-none focus:ring-2 focus:ring-[#95D2B3]"
        placeholder="Optional. e.g., Nakakatulong siya, mas naging kalmado ako."
      />
      <div className="mt-1 text-[11px] text-[#6b7280]">
        Comments with at least 10 characters will use text analysis (Filipino/English mixed is okay).
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: pageBackground }}>
      <Header />

      <div className="relative w-full max-w-3xl">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 blur-2xl opacity-40 rounded-[36px]" style={{ background: '#95D2B3' }} />

        <div className="bg-white/95 rounded-[32px] shadow-xl border border-[#E8F5E9] p-6 md:p-8">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E6F4EA' }}>
                <span className="material-icons-outlined" style={{ color: greenDark, fontSize: 20 }}>thumb_up</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b5f52]">Rate effectiveness</h2>
                <p className="text-[#3e8e7e] text-sm md:text-base">
                  Your feedback helps improve future recommendations.
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-[#3e8e7e]">Week window</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[#F7FBF4] border border-[#E6F4EA] text-[#1b5f52]">
                You can rate within this week
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E6F4EA]" />

          <div className="mt-6">
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse bg-gradient-to-r from-[#F7FBF4] to-[#EDF7F0] rounded-2xl p-5 border border-[#E6F4EA]">
                  <div className="h-4 w-2/3 bg-[#DDEFE3] rounded mb-2" />
                  <div className="h-4 w-1/2 bg-[#E6F4EA] rounded" />
                </div>
                <div className="animate-pulse h-24 w-full bg-[#F7FBF4] rounded-2xl border border-[#E6F4EA]" />
              </div>
            ) : recommendation ? (
              <>
                <RecommendationCard />
                <RatingSelector />
                <CommentBox />

                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 rounded-full border border-[#E6F4EA] bg-white text-[#1b5f52] text-sm font-semibold hover:bg-[#F7FBF4] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !rating}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white transition ${
                      submitting || !rating ? 'bg-[#94A3B8] cursor-not-allowed' : 'bg-[#1b5f52] hover:opacity-90'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit feedback'}
                  </button>
                </div>

                {/* Friendly note */}
                <div className="mt-4 text-[12px] flex items-center gap-2 text-[#6b7280]">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                  You can add a brief comment to improve accuracy, but it’s optional.
                </div>
              </>
            ) : (
              <div className="text-[#1f2a27]">
                <p className="text-sm">Recommendation not found.</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 rounded-full border border-[#E6F4EA] bg-white text-[#1b5f52] text-sm font-semibold hover:bg-[#F7FBF4] transition"
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 mb-6 text-white/85 text-sm">
        Thank you for helping improve your recommendations.
      </div>
    </div>
  );
};

export default RecommendationRating;