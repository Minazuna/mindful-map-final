import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import TeacherSidebar from './Sidebar';

const StudentLogs = () => {
  const { section } = useParams();
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [emotionFilter, setEmotionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [currentSection, setCurrentSection] = useState(null);

  useEffect(() => {
    fetchTeacherProfile();
    fetchStudentMoodLogs();
  }, [section]);

  useEffect(() => {
    filterLogs();
  }, [moodLogs, categoryFilter, emotionFilter]);

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

  const fetchStudentMoodLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${import.meta.env.VITE_NODE_API}/api/teacher/student-mood-logs`;
      
      // If section parameter exists, determine if it's a section name or student ID
      if (section && section !== 'section') {
        // Check if it's a valid MongoDB ObjectId (24 hex chars) - then it's a student ID
        const isStudentId = /^[a-f\d]{24}$/i.test(section);
        
        if (isStudentId) {
          // Fetch logs for specific student
          url = `${import.meta.env.VITE_NODE_API}/api/teacher/student-mood-logs/${section}`;
          setCurrentSection(null);
        } else {
          // Decode the section parameter and fetch logs for section
          const decodedSection = decodeURIComponent(section);
          url = `${import.meta.env.VITE_NODE_API}/api/teacher/mood-logs/${encodeURIComponent(decodedSection)}`;
          setCurrentSection(decodedSection);
        }
      } else {
        setCurrentSection(null);
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMoodLogs(response.data.data);
      } else {
        toast.error('Failed to fetch student mood logs');
      }
    } catch (error) {
      console.error('Error fetching student mood logs:', error);
      toast.error('Failed to fetch student mood logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = moodLogs;

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Emotion filter
    if (emotionFilter !== 'all') {
      filtered = filtered.filter(log => log.afterEmotion === emotionFilter);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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

  const getCategoryIcon = (category) => {
    const icons = {
      activity: '🏃',
      social: '👥',
      health: '🏥',
      sleep: '😴'
    };
    return icons[category] || '📝';
  };

  const getUniqueEmotions = () => {
    const emotions = new Set(moodLogs.map(log => log.afterEmotion));
    return Array.from(emotions).sort();
  };

  if (loading) {
    return (
      <div className="flex">
        <TeacherSidebar teacher={teacher} />
        <div className="flex-1 ml-72 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeacherSidebar teacher={teacher} />
      <div className="flex-1 ml-72 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Mood Logs</h1>
          {teacher && currentSection && (
            <div>
              <p className="text-lg text-gray-600">
                Section: <span className="font-semibold text-blue-600">{currentSection}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Total logs: {filteredLogs.length} of {moodLogs.length}
          </p>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Positive Valence</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Negative Valence</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">No Data</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="activity">Activity</option>
                <option value="social">Social</option>
                <option value="health">Health</option>
                <option value="sleep">Sleep</option>
              </select>
            </div>

            {/* Emotion Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emotion
              </label>
              <select
                value={emotionFilter}
                onChange={(e) => setEmotionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Emotions</option>
                {getUniqueEmotions().map(emotion => (
                  <option key={emotion} value={emotion}>{emotion}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setEmotionFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity/Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before Emotion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After Emotion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After Intensity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.studentEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(log.category)}</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {log.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.category === 'sleep' ? `${log.hrs} hours` : log.activity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.beforeEmotion ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmotionColor(log.beforeEmotion, log.beforeValence)}`}>
                          {log.beforeEmotion}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Can't remember</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.beforeEmotion && log.beforeIntensity ? (
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${log.beforeValence === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${(log.beforeIntensity / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{log.beforeIntensity}/5</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmotionColor(log.afterEmotion, log.afterValence)}`}>
                        {log.afterEmotion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${log.afterValence === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
                            style={{ width: `${(log.afterIntensity / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{log.afterIntensity}/5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentLogs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mood logs found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastLog, filteredLogs.length)}
                    </span> of{' '}
                    <span className="font-medium">{filteredLogs.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === index + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogs;