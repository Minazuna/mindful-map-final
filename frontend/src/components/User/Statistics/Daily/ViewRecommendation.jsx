import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewRecommendation = () => {
  const { recommendationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [recommendation, setRecommendation] = useState(location.state?.recommendation || null);
  const [feedback, setFeedback] = useState(location.state?.feedback || null);
  const [sentimentScore, setSentimentScore] = useState(location.state?.sentimentScore ?? 0);
  const [combinedScore, setCombinedScore] = useState(location.state?.combinedScore ?? 0);
  const [effective, setEffective] = useState(!!location.state?.effective);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fallback: if navigated directly, fetch recommendation details
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
  }, [recommendationId]);

  const effLabel = effective ? 'Effective' : 'Needs improvement';
  const effColor = effective ? '#1b5f52' : '#b91c1c';
  const scorePct = Math.round(Math.max(0, Math.min(1, combinedScore)) * 100);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #D8EFD3 0%, #74c89e 45%, #55AD9B 100%)' }}>
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-full bg-white/70 text-[#1b5f52] font-semibold shadow hover:bg-white transition backdrop-blur"
          >
            Back
          </button>
          <span className="text-white/90 text-sm">Recommendation</span>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl border border-[#E8F5E9] p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b5f52]">Your feedback summary</h2>

          <div className="mt-6 border-t border-[#E6F4EA]" />

          {loading ? (
            <div className="mt-6 animate-pulse h-24 w-full bg-[#F7FBF4] rounded-2xl border border-[#E6F4EA]" />
          ) : (
            <>
              {/* Recommendation text */}
              <div className="mt-6 rounded-2xl p-5 border border-[#E6F4EA] bg-white text-[#1f2a27] shadow-sm">
                {recommendation ? (
                  <>
                    <p className="text-base md:text-lg leading-relaxed">{recommendation.recommendation}</p>
                    <div className="mt-2 text-xs text-[#3e8e7e]">
                      <span>Category: {recommendation.category}</span>
                      {recommendation.activity && <span> • Activity: {recommendation.activity}</span>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#3e8e7e]">Recommendation details unavailable.</p>
                )}
              </div>

              {/* Feedback details */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-5 border border-[#E6F4EA] bg-[#F7FBF4]">
                  <div className="text-sm text-[#3e8e7e]">Your rating</div>
                  <div className="mt-2 text-3xl font-bold text-[#1b5f52]">
                    {feedback?.rating ?? '—'}
                  </div>
                  <div className="mt-1 text-xs text-[#3e8e7e]">Scale 1–5</div>
                </div>

                <div className="rounded-2xl p-5 border border-[#E6F4EA] bg-[#F7FBF4]">
                  <div className="text-sm text-[#3e8e7e]">Effectiveness</div>
                  <div className="mt-2 text-lg font-bold" style={{ color: effColor }}>
                    {effLabel}
                  </div>
                  <div className="mt-1 text-xs text-[#3e8e7e]">Combined score: {scorePct}%</div>
                  <div className="mt-1 text-xs text-[#3e8e7e]">Sentiment score: {sentimentScore?.toFixed(3)}</div>
                </div>
              </div>

              {/* Optional comment */}
              {feedback?.comment ? (
                <div className="mt-6 rounded-2xl p-5 border border-[#E6F4EA] bg-white text-[#1f2a27] shadow-sm">
                  <div className="text-sm text-[#3e8e7e]">Your comment</div>
                  <p className="mt-2 text-base leading-relaxed">{feedback.comment}</p>
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-full border border-[#E6F4EA] bg-white text-[#1b5f52] text-sm font-semibold hover:bg-[#F7FBF4] transition"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewRecommendation;