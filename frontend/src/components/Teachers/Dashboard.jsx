import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherProfile();
    fetchDashboardStats();
    fetchRecentLogs();
  }, []);

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
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Get only the 5 most recent logs
        setRecentLogs(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    } finally {
      setLoading(false);
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
      return 'text-green-600 bg-green-100';
    } else if (valence === 'negative') {
      return 'text-red-600 bg-red-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar teacher={teacher} />
        <div className="flex-1 ml-72 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar teacher={teacher} />
      
      <div className="flex-1 ml-72 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Teacher Dashboard</h1>
          {teacher && (
            <p className="text-lg text-gray-600">
              Welcome back, <span className="font-semibold text-blue-600">{teacher.firstName} {teacher.lastName}</span>
            </p>
          )}
        </div>

        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.studentsCount}</p>
                  <p className="text-xs text-gray-500">{dashboardStats.section}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Mood Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalMoodLogs}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.recentMoodLogs}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Most Common Mood</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {dashboardStats.moodDistribution.length > 0 
                      ? dashboardStats.moodDistribution[0]._id 
                      : 'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {dashboardStats.moodDistribution.length > 0 
                      ? `${dashboardStats.moodDistribution[0].count} entries`
                      : 'No data'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Mood Logs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Mood Logs</h2>
              <p className="text-sm text-gray-600 mt-1">Latest submissions from your students</p>
            </div>
            <div className="p-6">
              {recentLogs.length > 0 ? (
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {log.studentName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {log.studentName}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(log.date)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                            {log.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getEmotionColor(log.afterEmotion, log.afterValence)}`}>
                            {log.afterEmotion}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${log.afterValence === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
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
                      className="w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View All Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent logs</h3>
                  <p className="text-gray-500">Students haven't submitted any mood logs recently.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Distribution */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Mood Distribution</h2>
              <p className="text-sm text-gray-600 mt-1">Overview of emotions in your section</p>
            </div>
            <div className="p-6">
              {dashboardStats && dashboardStats.moodDistribution.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.moodDistribution.slice(0, 6).map((mood, index) => (
                    <div key={mood._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['bg-purple-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-gray-400'][index]
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{mood._id}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              ['bg-purple-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-gray-400'][index]
                            }`}
                            style={{ 
                              width: `${(mood.count / dashboardStats.moodDistribution[0].count) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{mood.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">😊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mood data</h3>
                  <p className="text-gray-500">Mood distribution will appear once students start logging.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Overview */}
        {teacher && (
          <div className="mt-8 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Section Overview</h2>
              <p className="text-sm text-gray-600 mt-1">Information about {teacher.assignedSection}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardStats ? dashboardStats.studentsCount : 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {dashboardStats ? dashboardStats.totalMoodLogs : 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {dashboardStats ? dashboardStats.recentMoodLogs : 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Recent Activity</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;