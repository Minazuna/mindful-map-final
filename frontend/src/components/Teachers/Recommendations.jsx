import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { FaBook, FaUsers, FaHeartbeat, FaSyncAlt, FaUserFriends, FaRegCommentDots } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const timeFilters = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const palette = {
  mint: 'bg-[#F6FBF7]',
  lightGreen: 'bg-[#E3F2EC]',
  teal: 'bg-[#55AD9B]',
  blue: 'bg-[#1F8E8E]',
  white: 'bg-white',
  border: 'border-[#D8EFD3]',
  accent: 'bg-[#55AD9B]',
  accentText: 'text-[#1F8E8E]',
  badge: 'bg-[#E3F2EC] text-[#1F8E8E]',
  card: 'bg-white',
  grayBtn: 'bg-[#F3F4F6] text-[#1F8E8E]',
  grayBtnHover: 'bg-[#e5e7eb]',
};

const categoryCards = [
  { key: 'activity', label: 'Activity', icon: <FaBook size={32} /> },
  { key: 'social', label: 'Social', icon: <FaUserFriends size={32} /> },
  { key: 'health', label: 'Health', icon: <FaHeartbeat size={32} /> }
];

const activityLabels = {
  commute: 'Commuting',
  exam: 'Having an exam',
  homework: 'Doing their homework',
  study: 'Studying',
  project: 'Doing a project',
  read: 'Reading',
  extracurricular: 'Doing an extracurricular activity',
  'household-chores': 'Doing household chores',
  relax: 'Relaxing',
  'watch-movie': 'Watching a movie',
  'listen-music': 'Listening to music',
  gaming: 'Gaming',
  'browse-internet': 'Browsing the internet',
  shopping: 'Shopping',
  travel: 'Traveling',
  alone: 'Being alone',
  friends: 'Socializing with their friends',
  family: 'Socializing with their family',
  classmates: 'Socializing with their classmates',
  relationship: 'Socializing with their significant other',
  online: 'Socializing online',
  pet: 'Being with their pet',
  jog: 'Jogging',
  walk: 'Walking',
  exercise: 'Exercising',
  sports: 'Playing a sport',
  meditate: 'Meditating',
  'eat-unhealthy': 'Eating unhealthy food',
  'eat-healthy': 'Eating healthy food',
  'no-physical': 'Not doing any physical activity',
  'drink-alcohol': 'Drinking alcohol'
};

const emotionToMoodType = (emotion) => {
  const e = (emotion || '').toLowerCase();
  const positive = ['happy', 'joyful', 'excited', 'calm', 'relaxed', 'content', 'grateful', 'proud'];
  const negative = ['sad', 'angry', 'anxious', 'stressed', 'worried', 'tired', 'frustrated', 'lonely', 'bored'];
  if (positive.includes(e)) return 'positive';
  if (negative.includes(e)) return 'negative';
  return 'negative';
};

const generateSentence = (sectionName, emotion, activity) => {
  const activityLabel = activityLabels[activity] || activity;
  const emotionLower = (emotion || '').toLowerCase();
  return `${activityLabel} left students in ${sectionName} feeling ${emotionLower}.`;
};

const Recommendations = () => {
  const [teacher, setTeacher] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [timeFilter, setTimeFilter] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [recommendationData, setRecommendationData] = useState({
    activity: [],
    social: [],
    health: []
  });

  const navigate = useNavigate();

  useEffect(() => { fetchTeacherProfile(); }, []);
  useEffect(() => { if (selectedSection) fetchRecommendations(); }, [selectedSection, timeFilter]);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTeacher(res.data.data);
        const secs = res.data.data.assignedSections || [];
        setSections(secs);
        if (secs.length) setSelectedSection(secs[0]);
      }
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendations-aggregate/${encodeURIComponent(selectedSection)}`,
        { params: { period: timeFilter }, headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setRecommendationData({
          activity: Array.isArray(res.data.data.activity) ? res.data.data.activity : [],
          social: Array.isArray(res.data.data.social) ? res.data.data.social : [],
          health: Array.isArray(res.data.data.health) ? res.data.data.health : []
        });
      } else {
        setRecommendationData({ activity: [], social: [], health: [] });
      }
    } catch {
      setRecommendationData({ activity: [], social: [], health: [] });
    } finally {
      setLoading(false);
    }
  };

  const fmtKey = (str) =>
    (str ? String(str).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() : '');

const handleViewRecommendation = async (categoryKey, rec, idx) => {
  const token = localStorage.getItem('token');
  let recommendations = [];
  let recId = rec._id;

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_NODE_API}/api/teacher/recommendations/${encodeURIComponent(selectedSection)}`,
      {
        params: {
          category: categoryKey,
          activity: rec.activity,
          afterEmotion: rec.afterEmotion,
          period: timeFilter,
          save: true
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (res.data && res.data.record) {
      recommendations = res.data.record.recommendations || [];
      recId = res.data.record._id;
    }
  } catch (err) {
    recommendations = [];
  }

  navigate('/teacher/view/recommendations', {
    state: {
      rec: {
        ...rec,
        recommendations,
        _id: recId
      },
      category: categoryKey,
      section: selectedSection,
      teacher
    }
  });
};

  const renderCategoryCard = (categoryKey, label, icon) => {
    const recs = recommendationData[categoryKey] || [];
    return (
      <div key={categoryKey} className={`w-full rounded-3xl ${palette.card} border-2 ${palette.border} shadow-xl overflow-hidden`}>
        <div className={`px-8 py-6 flex items-center justify-between ${palette.mint} border-b-2 ${palette.border}`}>
          <div className="flex items-center gap-6">
            <div className={`h-16 w-16 rounded-2xl ${palette.teal} flex items-center justify-center text-4xl shadow-md text-white`}>
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#1F8E8E]">{label} Insights</h2>
              <p className="text-base text-[#55AD9B] mt-1 font-medium">
                Patterns from {selectedSection || 'your sections'}
              </p>
            </div>
          </div>
          <span className={`text-base font-bold px-6 py-2 rounded-full ${palette.badge}`}>
            {timeFilters.find(t => t.value === timeFilter)?.label}
          </span>
        </div>
        <div className="p-8">
          {recs.length === 0 ? (
            <div className="text-center py-16">
              <FaRegCommentDots className="mx-auto mb-4 text-6xl text-[#95D2B3]" />
              <p className="font-bold text-[#1F8E8E] text-lg mb-2">No patterns yet</p>
              <p className="text-base text-[#55AD9B]">
                Check back when students log more moods
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {recs.slice(0, 6).map((rec, idx) => {
                const labelText = generateSentence(
                  selectedSection,
                  rec?.afterEmotion,
                  rec?.activity || rec?.message || rec?.text
                );
                return (
                  <li key={rec._id ? `${categoryKey}-${rec._id}` : `${categoryKey}-${fmtKey(rec?.activity || rec?.message || rec?.text)}-${rec?.afterEmotion || ''}-${idx}`} className="group">
                    <div className={`rounded-2xl border border-[#95D2B3] shadow-md hover:shadow-xl transition-all p-6 ${palette.white}`}>
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-[#1F8E8E] leading-relaxed break-words">
                            {labelText}
                          </p>
                          {rec?.count && (
                            <div className="flex items-center gap-2 mt-3">
                              <FaUsers className="text-[#55AD9B] text-lg" />
                              <p className="text-base font-medium text-[#55AD9B]">
                                {rec.count > 1 ? `${rec.count} students` : `${rec.count} student`}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 shrink-0">
                          <button
                            onClick={() => handleViewRecommendation(categoryKey, rec, idx)}
                            className={`text-base font-bold px-4 py-2 rounded-xl ${palette.grayBtn} hover:${palette.grayBtnHover} transition-all flex items-center gap-2`}
                          >
                            <FaRegCommentDots /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {recs.length > 6 && (
            <div className="mt-6 text-center">
              <p className="text-base text-[#55AD9B] font-medium">
                +{recs.length - 6} more insights available
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen ${palette.white}`}>
      <Sidebar teacher={teacher} />
      <div className="flex-1 ml-72">
        <div className={`bg-[#F6FBF7] border-b-2 ${palette.border} sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto px-12 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-[#1F8E8E]">Student Insights</h1>
                <p className="text-lg text-[#55AD9B] mt-2 font-medium">
                  Understand mood patterns and respond with targeted support
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-12 py-10">
          <div className={`rounded-2xl border border-[#95D2B3] shadow-md p-7 mb-10 flex flex-wrap gap-8 items-center justify-between ${palette.card}`}>
            <div className="flex items-center gap-4">
              <label className="text-base font-bold text-[#1F8E8E] uppercase tracking-wider">Section</label>
              <select
                className="text-lg rounded-xl border border-[#95D2B3] px-5 py-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#55AD9B]"
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                {sections.length === 0 && (
                  <option value="">No sections</option>
                )}
                {sections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-base font-bold text-[#1F8E8E] uppercase tracking-wider">Period</label>
              <select
                className="text-lg rounded-xl border border-[#95D2B3] px-5 py-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#55AD9B]"
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
              >
                {timeFilters.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchRecommendations}
              className="inline-flex items-center gap-3 rounded-xl bg-[#55AD9B] text-white text-lg font-bold px-6 py-3 hover:bg-[#1F8E8E] transition-all"
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="space-y-4 text-center">
                <div className="inline-flex">
                  <FaSyncAlt className="animate-spin text-6xl text-[#1F8E8E]" />
                </div>
                <p className="text-lg text-[#55AD9B] font-semibold">Loading insights...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {categoryCards.map(card => (
                <div key={card.key}>
                  {renderCategoryCard(
                    card.key,
                    card.label,
                    card.icon
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;