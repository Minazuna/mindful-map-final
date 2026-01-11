import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import MoodAnalysis from './MoodAnalysis';
import CategoricalLogs from './CategoricalLogs';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { generateMoodDistributionPDF } from '../PDFTemplates/AnalysisPDF';

const Dashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Filter States
  const [statsSection, setStatsSection] = useState('All');
  const [statsValence, setStatsValence] = useState('Both');
  const [logsSection, setLogsSection] = useState('All');

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [statsSection, statsValence]);

  useEffect(() => {
    fetchRecentLogs();
  }, [logsSection]);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTeacher(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      toast.error('Failed to fetch teacher profile');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { section: statsSection, valence: statsValence }
      });
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/student-mood-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { section: logsSection }
      });
      if (response.data.success) {
        setRecentLogs(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatsPDF = async () => {
    try {
      if (!dashboardStats) return;
      await generateMoodDistributionPDF(statsSection, statsValence, dashboardStats.moodDistribution);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmotionColor = (emotion, valence) => {
    if (valence === 'positive') {
      return 'text-green-700 bg-green-200';
    } else if (valence === 'negative') {
      return 'text-red-700 bg-red-200';
    }
    return 'text-gray-700 bg-gray-200';
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      pleased: '#A78BFA',      // purple-400
      happy: '#F472B6',        // pink-400
      relaxed: '#4ADE80',      // green-400
      calm: '#FACC15',         // yellow-400
      angry: '#F87171',        // red-400
      disappointed: '#22D3EE', // cyan-400
      tense: '#818CF8',        // indigo-400
      sad: '#2DD4BF',          // teal-400
      excited: '#FB923C',      // orange-400
      bored: '#60A5FA'         // blue-400
    };
    return moodColors[mood?.toLowerCase()] || '#9CA3AF'; // gray-400 as fallback
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar teacher={teacher} />
        <div className="flex-1 ml-72 flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      <Sidebar teacher={teacher} />

      <div className="flex-1 ml-72 p-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3 tracking-tight drop-shadow-lg">Teacher Dashboard</h1>
          {teacher && (
            <p className="text-xl text-gray-700 font-medium">
              Welcome back, <span className="font-bold text-blue-700">{teacher.firstName} {teacher.lastName}</span>
            </p>
          )}
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform duration-200">
              <div className="p-4 rounded-full bg-blue-200 text-blue-700 mb-3 shadow">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">Total Students</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardStats.studentsCount}</p>
              <p className="text-sm text-gray-500 mt-1">{dashboardStats.section}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform duration-200">
              <div className="p-4 rounded-full bg-green-200 text-green-700 mb-3 shadow">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">Total Mood Logs</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardStats.totalMoodLogs}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform duration-200">
              <div className="p-4 rounded-full bg-purple-200 text-purple-700 mb-3 shadow">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">Recent Activity</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{dashboardStats.recentMoodLogs}</p>
              <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform duration-200">
              <div className="p-4 rounded-full bg-orange-200 text-orange-700 mb-3 shadow">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600">Most Common Mood</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1 capitalize">
                {dashboardStats.moodDistribution.length > 0 
                  ? dashboardStats.moodDistribution[0]._id 
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dashboardStats.moodDistribution.length > 0 
                  ? `${dashboardStats.moodDistribution[0].count} entries`
                  : 'No data'
                }
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Recent Mood Logs */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Recent Mood Logs</h2>
                  <p className="text-base text-gray-600 mt-1">Latest submissions from your students</p>
                </div>
                {teacher && teacher.assignedSections && (
                  <select
                    value={logsSection}
                    onChange={(e) => setLogsSection(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-500 font-medium text-sm"
                  >
                    <option value="All">All Sections</option>
                    {teacher.assignedSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="p-8">
              {recentLogs.length > 0 ? (
                <div className="space-y-5">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 rounded-xl shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shadow">
                              <span className="text-blue-700 font-bold text-lg">
                                {log.studentName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-gray-900 truncate">
                              {log.studentName}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(log.date)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center space-x-3">
                          <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full capitalize font-medium">
                            {log.category}
                          </span>
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${getEmotionColor(log.afterEmotion, log.afterValence)}`}>
                            {log.afterEmotion}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <div className="text-right">
                          <div className="w-24 bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full ${log.afterValence === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${(log.afterIntensity / 5) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{log.afterIntensity}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button
                      onClick={() => window.location.href = '/teacher/student-logs'}
                      className="w-full text-center py-3 px-4 border border-gray-300 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    >
                      View All Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No recent logs</h3>
                  <p className="text-gray-500">Students haven't submitted any mood logs recently.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Distribution */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Mood Distribution</h2>
                  <p className="text-base text-gray-600 mt-1">Overview of emotions in your section</p>
                </div>
                {dashboardStats && (
                  <button
                    onClick={handleDownloadStatsPDF}
                    className="p-2 rounded-lg text-blue-600 hover:bg-gray-100 transition-colors"
                    title="Download Mood Distribution PDF"
                  >
                    <FileDownloadIcon />
                  </button>
                )}
              </div>
              <div className="flex gap-4 mt-4">
                {teacher && teacher.assignedSections && (
                  <select
                    value={statsSection}
                    onChange={(e) => setStatsSection(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-500 font-medium text-sm"
                  >
                    <option value="All">All Sections</option>
                    {teacher.assignedSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                )}
                <select
                  value={statsValence}
                  onChange={(e) => setStatsValence(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-500 font-medium text-sm"
                >
                  <option value="Both">Both Valences</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            </div>
            <div className="p-8">
              {dashboardStats && dashboardStats.moodDistribution.length > 0 ? (
                <div className="space-y-5 max-h-96 overflow-y-auto">
                  {dashboardStats.moodDistribution.map((mood) => (
                    <div key={mood._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getMoodColor(mood._id) }}
                        ></div>
                        <span className="text-lg font-semibold text-gray-900 capitalize">{mood._id}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-40 bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full"
                            style={{ 
                              backgroundColor: getMoodColor(mood._id),
                              width: `${(mood.count / dashboardStats.moodDistribution[0].count) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-lg text-gray-600 w-10 text-right">{mood.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">😊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No mood data</h3>
                  <p className="text-gray-500">Mood distribution will appear once students start logging.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="mt-10 grid grid-cols-1 gap-10">
          <MoodAnalysis isDashboard={true} teacher={teacher} />
          <CategoricalLogs isDashboard={true} teacher={teacher} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;