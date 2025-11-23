import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

const Recommendation = () => {
  const { moodScoreId } = useParams();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendation = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/recommendations/generate`,
          { moodScoreId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecommendations(res.data.recommendations || []);
      } catch (error) {
        setRecommendations([]);
      }
      setLoading(false);
    };
    fetchRecommendation();
  }, [moodScoreId]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #D8EFD3 0%, #74c89eff 50%, #55AD9B 100%)',
      }}
    >
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 px-5 py-2 rounded-full bg-[#55AD9B] text-white font-semibold shadow hover:bg-[#3e8e7e] transition flex items-center gap-2"
      >
        <ArrowBackIcon style={{ fontSize: 22 }} />
        Back
      </button>
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#D8EFD3] p-10 max-w-2xl w-full flex flex-col items-center relative">
        <div className="absolute -top-[-5px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] rounded-full p-4 shadow-lg">
          <EmojiObjectsIcon style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-[#55AD9B] text-center mt-6">
          Personalized Recommendation
        </h2>
        <p className="text-[#3e8e7e] text-center mb-6 italic">
          “Small steps each day lead to big changes over time.”
        </p>
        {loading ? (
          <div className="flex flex-col items-center text-[#55AD9B] mt-8">
            <SentimentSatisfiedAltIcon style={{ fontSize: 36, marginBottom: 8 }} />
            <span className="text-lg font-semibold animate-pulse">Loading your advice...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <ul className="space-y-6 w-full">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 bg-gradient-to-r from-[#F1F8E8] to-[#E6F4EA] rounded-2xl px-6 py-5 text-lg text-[#272829] shadow border-l-4 border-[#55AD9B] animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CheckCircleIcon style={{ color: '#55AD9B', marginTop: 2 }} />
                <span>{rec.recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center text-gray-500 mt-8">
            <SentimentSatisfiedAltIcon style={{ fontSize: 36, marginBottom: 8 }} />
            <span className="text-lg">No recommendation found for today.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendation;