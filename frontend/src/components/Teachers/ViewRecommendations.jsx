import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaUsers, FaRegCommentDots, FaArrowLeft, FaEdit, FaTrash, FaSave, FaTimes, FaCheck, FaChevronLeft, FaChevronRight, FaCalendarDay, FaCalendarWeek, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

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

const generateSentence = (sectionName, emotion, activity) => {
  const activityLabel = activityLabels[activity] || activity;
  const emotionLower = (emotion || '').toLowerCase();
  return `${activityLabel} left students in ${sectionName} feeling ${emotionLower}.`;
};

// Helper functions for period navigation
function getPeriodStart(date, period) {
  const d = new Date(date);
  if (period === 'daily') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'weekly') {
    // Set to Monday
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'monthly') {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return d;
}
function addPeriod(date, period, amount) {
  const d = new Date(date);
  if (period === 'daily') d.setDate(d.getDate() + amount);
  if (period === 'weekly') d.setDate(d.getDate() + 7 * amount);
  if (period === 'monthly') d.setMonth(d.getMonth() + amount);
  return d;
}
function formatPeriodLabel(date, period) {
  const d = new Date(date);
  if (period === 'daily') {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (period === 'weekly') {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (period === 'monthly') {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  }
  return '';
}

const periodIcons = {
  daily: <FaCalendarDay className="inline mr-2" />,
  weekly: <FaCalendarWeek className="inline mr-2" />,
  monthly: <FaCalendarAlt className="inline mr-2" />
};

const ViewRecommendations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, section, teacher, period = 'weekly', rec } = location.state || {};

  // Period navigation state
  const [baseDate, setBaseDate] = useState(() => getPeriodStart(new Date(), period));
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback state
  const [feedback, setFeedback] = useState({});
  const [modalFeedbackTexts, setModalFeedbackTexts] = useState({});
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState({});
  const [editingText, setEditingText] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, recId: null, suggestionIdx: null, fbIdx: null });
  const [feedbackEffectiveness, setFeedbackEffectiveness] = useState({});
  const [savingFeedbackEffectiveness, setSavingFeedbackEffectiveness] = useState({});

  // Only allow navigation to today or previous periods
  const todayPeriodStart = getPeriodStart(new Date(), period);
  const isCurrentPeriod = baseDate.getTime() === todayPeriodStart.getTime();

  // Fetch recommendations for the current period
  useEffect(() => {
    if (!section || !category) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Use the backend route for past recommendations
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/past-recommendations/${encodeURIComponent(section)}`,
          {
            params: {
              category,
              period,
              startDate: baseDate.toISOString(),
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setRecommendations(res.data.data);
        } else {
          setRecommendations([]);
        }
      } catch {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [section, category, period, baseDate]);

  // Feedback fetching for each recommendation
  useEffect(() => {
    if (recommendations.length > 0) {
      recommendations.forEach((rec, idx) => {
        if (rec && rec._id && Array.isArray(rec.recommendations)) {
          rec.recommendations.forEach((_, sidx) => fetchFeedbackForRec(rec._id, sidx, idx));
        }
      });
    }
    // eslint-disable-next-line
  }, [recommendations]);

  const fetchFeedbackForRec = async (recommendationId, suggestionIdx, recIdx) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendation-feedback/${recommendationId}/${suggestionIdx}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setFeedback(prev => ({
          ...prev,
          [`${recommendationId}-${suggestionIdx}`]: res.data.data || []
        }));
        const effObj = {};
        (res.data.data || []).forEach((fb, fbIdx) => {
          effObj[fbIdx] = fb.effective;
        });
        setFeedbackEffectiveness(prev => ({
          ...prev,
          [`${recommendationId}-${suggestionIdx}`]: effObj
        }));
      } else {
        setFeedback(prev => ({
          ...prev,
          [`${recommendationId}-${suggestionIdx}`]: []
        }));
        setFeedbackEffectiveness(prev => ({
          ...prev,
          [`${recommendationId}-${suggestionIdx}`]: {}
        }));
      }
    } catch {
      setFeedback(prev => ({
        ...prev,
        [`${recommendationId}-${suggestionIdx}`]: []
      }));
      setFeedbackEffectiveness(prev => ({
        ...prev,
        [`${recommendationId}-${suggestionIdx}`]: {}
      }));
    }
  };

  const submitModalFeedback = async (recId, suggestionIdx) => {
    const feedbackText = modalFeedbackTexts[`${recId}-${suggestionIdx}`] || '';
    if (!feedbackText.trim()) {
      toast.warn('Please enter feedback.');
      return;
    }
    setSavingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendation-feedback/${recId}/${suggestionIdx}`,
        { feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Feedback saved.');
      setModalFeedbackTexts(prev => ({ ...prev, [`${recId}-${suggestionIdx}`]: '' }));
      fetchFeedbackForRec(recId, suggestionIdx);
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleEditFeedback = (recId, idx, fbIdx, text) => {
    setEditingFeedback({ recId, idx, fbIdx });
    setEditingText({ recId, idx, fbIdx, text });
  };

  const handleSaveEditFeedback = async (recId, suggestionIdx, fbIdx) => {
    const text = editingText.text;
    if (!text.trim()) {
      toast.warn('Feedback cannot be empty.');
      return;
    }
    setSavingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendation-feedback/${recId}/${suggestionIdx}/${fbIdx}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Feedback updated.');
      setEditingFeedback({});
      setEditingText({});
      fetchFeedbackForRec(recId, suggestionIdx);
    } catch (err) {
      toast.error('Failed to update feedback.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDeleteFeedback = async () => {
    const { recId, suggestionIdx, fbIdx } = deleteModal;
    setSavingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendation-feedback/${recId}/${suggestionIdx}/${fbIdx}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Feedback deleted.');
      fetchFeedbackForRec(recId, suggestionIdx);
      setDeleteModal({ open: false, recId: null, suggestionIdx: null, fbIdx: null });
    } catch (err) {
      toast.error('Failed to delete feedback.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleFeedbackEffective = async (recId, suggestionIdx, fbIdx, value) => {
    setSavingFeedbackEffectiveness(prev => ({
      ...prev,
      [`${recId}-${suggestionIdx}-${fbIdx}`]: true
    }));
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_NODE_API}/api/teacher/recommendation-feedback-effective/${recId}/${suggestionIdx}/${fbIdx}`,
        { effective: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackEffectiveness(prev => ({
        ...prev,
        [`${recId}-${suggestionIdx}`]: {
          ...(prev[`${recId}-${suggestionIdx}`] || {}),
          [fbIdx]: value
        }
      }));
      toast.success('Saved!');
    } catch (err) {
      toast.error('Failed to save effectiveness.');
    } finally {
      setSavingFeedbackEffectiveness(prev => ({
        ...prev,
        [`${recId}-${suggestionIdx}-${fbIdx}`]: false
      }));
    }
  };

  // Navigation handlers
  const handlePrevPeriod = () => setBaseDate(prev => getPeriodStart(addPeriod(prev, period, -1), period));
  const handleNextPeriod = () => {
    if (!isCurrentPeriod) setBaseDate(prev => getPeriodStart(addPeriod(prev, period, 1), period));
  };
  const handleToday = () => setBaseDate(todayPeriodStart);

  if (!section || !category) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar teacher={teacher} />
        <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[#1F8E8E] font-bold mb-4">No recommendation data found.</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#55AD9B] text-white font-bold text-lg hover:bg-[#1F8E8E] transition"
            >
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F6FBF7] overflow-x-hidden">
      <Sidebar teacher={teacher} />
      <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 flex flex-col min-w-0">
        <div className="max-w-full mx-auto w-full px-4 sm:px-8 py-10 flex-1 flex flex-col">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-[#1F8E8E] font-semibold"
              title="Go back to previous page"
              style={{ minWidth: 0, width: 'auto' }}
            >
              <FaArrowLeft className="mr-1" /> Back
            </button>
            <div className="flex-1 flex items-center justify-center gap-2">
              <button
                onClick={handlePrevPeriod}
                className="p-2 rounded-lg bg-[#E3F2EC] text-[#1F8E8E] hover:bg-[#D8EFD3] transition"
                title="Previous"
              >
                <FaChevronLeft />
              </button>
              <span className="text-lg font-bold text-[#1F8E8E] flex items-center gap-2 px-4">
                {periodIcons[period]} {formatPeriodLabel(baseDate, period)}
              </span>
              <button
                onClick={handleNextPeriod}
                className={`p-2 rounded-lg ${isCurrentPeriod ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#E3F2EC] text-[#1F8E8E] hover:bg-[#D8EFD3]'} transition`}
                title="Next"
                disabled={isCurrentPeriod}
              >
                <FaChevronRight />
              </button>
              {!isCurrentPeriod && (
                <button
                  onClick={handleToday}
                  className="ml-2 px-3 py-1 rounded-lg bg-[#55AD9B] text-white font-semibold hover:bg-[#1F8E8E] transition"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl border-2 border-[#D8EFD3] shadow-2xl p-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-extrabold text-[#1F8E8E]">Recommendation Details</h2>
              {category && (
                <span className="text-xs px-4 py-2 rounded-full bg-[#E3F2EC] uppercase tracking-wide font-bold text-[#1F8E8E]">
                  {category}
                </span>
              )}
            </div>
            {loading ? (
              <div className="text-center py-12 text-[#55AD9B] font-semibold">Loading recommendations...</div>
            ) : recommendations.length > 0 ? (
              recommendations.map((rec, recIdx) => (
                <div key={rec._id || recIdx} className="mb-10">
                  <div className="mb-4 p-4 rounded-xl border border-[#95D2B3] bg-[#F6FBF7]">
                    <p className="text-lg text-[#1F8E8E] font-medium">
                      {generateSentence(
                        section,
                        rec?.afterEmotion,
                        rec?.activity || rec?.message || rec?.text
                      )}
                    </p>
                    {rec?.count && (
                      <div className="mt-2 flex items-center gap-2 text-base">
                        <FaUsers className="text-[#95D2B3]" />
                        <span className="font-semibold text-[#1F8E8E]">
                          {rec.count > 1
                            ? `${rec.count} students reported this pattern`
                            : `${rec.count} student reported this pattern`}
                        </span>
                      </div>
                    )}
                  </div>
                  {Array.isArray(rec.recommendations) && rec.recommendations.length > 0 && (
                    <ul className="space-y-7">
                      {rec.recommendations.map((r, i) => (
                        <li key={i} className="p-6 rounded-xl border border-[#95D2B3] bg-[#F6FBF7]">
                          <div className="flex items-start gap-4 mb-4">
                            <FaRegCommentDots className="text-[#1F8E8E] font-bold text-xl flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <span className="text-base text-[#1F8E8E] leading-relaxed block font-medium">{typeof r === 'string' ? r : r.text}</span>
                              {r.source && (
                                <span className="block text-xs text-[#55AD9B] mt-2 italic">
                                  Source: {r.source}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Feedback log for this suggestion */}
                          <div className="mt-6 border-t border-[#E3F2EC] pt-6">
                            <h5 className="text-base font-bold text-[#1F8E8E] mb-4">Feedback Log</h5>
                            <div className="space-y-4 max-h-48 overflow-y-auto">
                              {Array.isArray(feedback?.[`${rec._id}-${i}`]) && feedback[`${rec._id}-${i}`].length > 0 ? (
                                feedback[`${rec._id}-${i}`].map((f, j) => (
                                  <div
                                    key={`modal-fb-${rec._id}-${i}-${j}`}
                                    className="p-4 bg-white rounded-lg border border-[#D8EFD3] shadow-sm hover:shadow-md transition"
                                  >
                                    {editingFeedback.recId === rec._id && editingFeedback.idx === i && editingFeedback.fbIdx === j ? (
                                      <div className="flex gap-2">
                                        <textarea
                                          className="flex-1 text-sm border-2 border-[#55AD9B] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1F8E8E]"
                                          value={editingText.text}
                                          onChange={e =>
                                            setEditingText({
                                              ...editingText,
                                              text: e.target.value
                                            })
                                          }
                                        />
                                        <div className="flex gap-2 flex-shrink-0">
                                          <button
                                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                                            onClick={() => handleSaveEditFeedback(rec._id, i, j)}
                                            disabled={savingFeedback}
                                            title="Save"
                                          >
                                            <FaCheck className="text-lg" />
                                          </button>
                                          <button
                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                            onClick={() => setEditingFeedback({})}
                                            title="Cancel"
                                          >
                                            <FaTimes className="text-lg" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <p className="text-base text-[#1F8E8E] font-medium leading-relaxed">{f.text}</p>
                                            <p className="text-sm text-[#95D2B3] mt-3">
                                              {new Date(f.createdAt).toLocaleDateString()} at{' '}
                                              {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {/* Effectiveness buttons */}
                                            <div className="mt-4 flex flex-col gap-3">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm text-[#1F8E8E] font-semibold">Effective?</span>
                                                <button
                                                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                                                    feedbackEffectiveness?.[`${rec._id}-${i}`]?.[j] === true
                                                      ? 'bg-[#55AD9B] text-white'
                                                      : 'bg-[#F3F4F6] text-[#1F8E8E] hover:bg-[#e5e7eb]'
                                                  }`}
                                                  disabled={savingFeedbackEffectiveness[`${rec._id}-${i}-${j}`]}
                                                  onClick={() => handleFeedbackEffective(rec._id, i, j, true)}
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                                                    feedbackEffectiveness?.[`${rec._id}-${i}`]?.[j] === false
                                                      ? 'bg-[#55AD9B] text-white'
                                                      : 'bg-[#F3F4F6] text-[#1F8E8E] hover:bg-[#e5e7eb]'
                                                  }`}
                                                  disabled={savingFeedbackEffectiveness[`${rec._id}-${i}-${j}`]}
                                                  onClick={() => handleFeedbackEffective(rec._id, i, j, false)}
                                                >
                                                  No
                                                </button>
                                              </div>
                                              {feedbackEffectiveness?.[`${rec._id}-${i}`]?.[j] !== undefined && (
                                                <p className={`text-sm font-semibold ${
                                                  feedbackEffectiveness[`${rec._id}-${i}`][j]
                                                    ? 'text-[#55AD9B]'
                                                    : 'text-[#E07B39]'
                                                }`}>
                                                  {feedbackEffectiveness[`${rec._id}-${i}`][j]
                                                    ? '✓ Thank you! The recommendation is effective'
                                                    : '⚠ We appreciate your feedback.'}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          {/* Edit and Delete buttons */}
                                          <div className="flex gap-2 flex-shrink-0 mt-2">
                                            <button
                                              className="p-2.5 text-[#55AD9B] "
                                              onClick={() => handleEditFeedback(rec._id, i, j, f.text)}
                                              title="Edit"
                                            >
                                              <FaEdit className="text-lg" />
                                            </button>
                                            <button
                                              className="p-2.5 text-[#E07B39] "
                                              onClick={() => setDeleteModal({ open: true, recId: rec._id, suggestionIdx: i, fbIdx: j })}
                                              title="Delete"
                                            >
                                              <FaTrash className="text-lg" />
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-base text-[#95D2B3] text-center py-4">
                                  No notes yet. Start by adding feedback below.
                                </p>
                              )}
                            </div>
                            {/* Add Feedback Section */}
                            <div className="mt-5 pt-5 border-t border-[#E3F2EC]">
                              <p className="text-sm text-[#55AD9B] font-semibold mb-3">Add a note</p>
                              <div className="flex gap-3">
                                <textarea
                                  value={modalFeedbackTexts[`${rec._id}-${i}`] || ''}
                                  onChange={e => setModalFeedbackTexts(prev => ({
                                    ...prev,
                                    [`${rec._id}-${i}`]: e.target.value
                                  }))}
                                  placeholder="Share your observations..."
                                  rows={2}
                                  className="flex-1 text-base p-3 border border-[#D8EFD3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#55AD9B] resize-none"
                                />
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => submitModalFeedback(rec._id, i)}
                                    disabled={savingFeedback || !modalFeedbackTexts[`${rec._id}-${i}`]?.trim()}
                                    className="px-5 py-2 rounded-lg text-base font-semibold bg-[#55AD9B] text-white hover:bg-[#1F8E8E] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                  >
                                    {savingFeedback ? '...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => fetchFeedbackForRec(rec._id, i)}
                                    className="px-5 py-2 rounded-lg text-base font-semibold bg-[#E3F2EC] text-[#1F8E8E] hover:bg-[#D8EFD3] transition"
                                  >
                                    Refresh
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <div className="mb-8 p-6 bg-[#F6FBF7] rounded-xl border border-[#95D2B3] text-center">
                <p className="text-lg text-[#1F8E8E] font-medium">
                  No recommendations found for this period.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Delete Feedback Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-xs w-full">
            <h3 className="text-lg font-bold text-[#1F8E8E] mb-4">Delete Feedback</h3>
            <p className="mb-6 text-[#55AD9B]">Are you sure you want to delete this feedback?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-[#F3F4F6] text-[#1F8E8E] hover:bg-[#e5e7eb] font-semibold transition"
                onClick={() => setDeleteModal({ open: false, recId: null, suggestionIdx: null, fbIdx: null })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#FF6B6B] text-white hover:bg-[#e53e3e] font-semibold transition"
                onClick={handleDeleteFeedback}
                disabled={savingFeedback}
              >
                {savingFeedback ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRecommendations;