import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import TeacherSidebar from './Sidebar';

const StudentLogs = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const [moodLogs, setMoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [currentSection, setCurrentSection] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    beforeValence: '',
    afterValence: '',
    startDate: null,
    endDate: null,
    searchTerm: '',
    beforeReason: '',
    afterReason: ''
  });

  useEffect(() => {
    fetchTeacherProfile();
    fetchStudentMoodLogs();
  }, [section]);

  useEffect(() => {
    applyFilters();
  }, [filters, moodLogs]);

  const applyFilters = () => {
    let filtered = [...moodLogs];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    // Before valence filter
    if (filters.beforeValence) {
      filtered = filtered.filter(log => log.beforeValence === filters.beforeValence);
    }

    // After valence filter
    if (filters.afterValence) {
      filtered = filtered.filter(log => log.afterValence === filters.afterValence);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.date) >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.date) <= filters.endDate);
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.activity?.toLowerCase().includes(searchLower) ||
        log.beforeEmotion?.toLowerCase().includes(searchLower) ||
        log.afterEmotion?.toLowerCase().includes(searchLower)
      );
    }

    // Before reason filter
    if (filters.beforeReason) {
      const beforeLower = filters.beforeReason.toLowerCase();
      filtered = filtered.filter(log =>
        log.beforeReason?.toLowerCase().includes(beforeLower)
      );
    }

    // After reason filter
    if (filters.afterReason) {
      const afterLower = filters.afterReason.toLowerCase();
      filtered = filtered.filter(log =>
        log.afterReason?.toLowerCase().includes(afterLower)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      beforeValence: '',
      afterValence: '',
      startDate: null,
      endDate: null,
      searchTerm: '',
      beforeReason: '',
      afterReason: ''
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value =>
      value !== '' && value !== null && value !== undefined
    ).length;
  };

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

      if (section && section !== 'section') {
        const isStudentId = /^[a-f\d]{24}$/i.test(section);

        if (isStudentId) {
          url = `${import.meta.env.VITE_NODE_API}/api/teacher/student-mood-logs/${section}`;
          setCurrentSection(null);
        } else {
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

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Pagination UI logic (show 1-10, then arrows)
  const getPageNumbers = () => {
    const maxPagesToShow = 10;
    let start = 1;
    let end = totalPages;

    if (totalPages > maxPagesToShow) {
      if (currentPage <= 6) {
        start = 1;
        end = maxPagesToShow;
      } else if (currentPage + 4 >= totalPages) {
        start = totalPages - maxPagesToShow + 1;
        end = totalPages;
      } else {
        start = currentPage - 5;
        end = currentPage + 4;
      }
    }

    return Array.from({ length: Math.min(end - start + 1, maxPagesToShow) }, (_, i) => start + i);
  };

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

  // Utility: Capitalize first letter and remove dashes
  const formatText = (text) => {
    if (!text) return '';
    return text
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
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
    <div className="flex min-h-screen w-full bg-[#F7F7F7]">
      <TeacherSidebar teacher={teacher} />
      <div className="flex-1 ml-72 p-6 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                title="Go back to previous page"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                <div className="flex items-center justify-center text-3xl font-bold text-gray-800">Student Mood Logs</div>
            </div>

            {/* Student Info Card - only show when viewing individual student */}
            {moodLogs.length > 0 && !currentSection && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-lg  text-gray-900">Name</p>
                    <p className="text-lg font-medium text-gray-500">{moodLogs[0]?.studentName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Email</p>
                    <p className="text-lg text-gray-500">{moodLogs[0]?.studentEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Section</p>
                    <p className="text-lg text-gray-500">{moodLogs[0]?.studentSection || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Total Logs</p>
                    <p className="text-lg text-[#55AD9B] font-bold">{moodLogs.length}</p>
                  </div>
                </div>
              </div>
            )}

            {teacher && currentSection && (
              <div>
                <p className="text-lg text-gray-600">
                  Section: <span className="font-semibold text-blue-600">{currentSection}</span>
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className=" p-4 mb-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-green-400 rounded-full"></div>
                <span className="text-md text-gray-600">Positive Valence</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-red-400 rounded-full"></div>
                <span className="text-md text-gray-600">Negative Valence</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-md text-gray-600">No Data</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    showFilters
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                    </svg>
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getActiveFiltersCount()}
                      </span>
                    )}
                  </div>
                </button>

                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Clear Filters
                  </button>
                )}

                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{moodLogs.length}</span> logs
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <select
                  value={logsPerPage}
                  onChange={e => {
                    setLogsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 25, 50, 100].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search activities, emotions..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Categories</option>
                      <option value="activity">Activity</option>
                      <option value="social">Social</option>
                      <option value="health">Health</option>
                      <option value="sleep">Sleep</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Before Valence</label>
                    <select
                      value={filters.beforeValence}
                      onChange={(e) => handleFilterChange('beforeValence', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="can't remember">Can't Remember</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">After Valence</label>
                    <select
                      value={filters.afterValence}
                      onChange={(e) => handleFilterChange('afterValence', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Before Reason</label>
                    <input
                      type="text"
                      placeholder="Search before reason..."
                      value={filters.beforeReason}
                      onChange={(e) => handleFilterChange('beforeReason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">After Reason</label>
                    <input
                      type="text"
                      placeholder="Search after reason..."
                      value={filters.afterReason}
                      onChange={(e) => handleFilterChange('afterReason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '400px' }}>
                      Before Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      After Emotion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      After Intensity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '400px' }}>
                      After Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {log.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.category === 'sleep'
                          ? `${log.hrs} hours`
                          : formatText(log.activity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.beforeEmotion ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmotionColor(log.beforeEmotion, log.beforeValence)}`}>
                            {formatText(log.beforeEmotion)}
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
                      <td className="px-6 py-4 text-sm text-gray-900" style={{ width: '400px' }}>
                        <div className="break-words" style={{ maxWidth: '380px' }}>
                          {log.beforeReason || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmotionColor(log.afterEmotion, log.afterValence)}`}>
                          {formatText(log.afterEmotion)}
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
                      <td className="px-6 py-4 text-sm text-gray-900" style={{ width: '400px' }}>
                        <div className="break-words" style={{ maxWidth: '380px' }}>
                          {log.afterReason || 'N/A'}
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
              <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                <div className="mb-2 sm:mb-0 text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastLog, filteredLogs.length)}
                  </span> of{' '}
                  <span className="font-medium">{filteredLogs.length}</span> results
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    title="First"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    title="Previous"
                  >
                    &lsaquo;
                  </button>
                  {getPageNumbers().map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`px-3 py-1 rounded-md border text-sm font-medium ${
                        currentPage === num
                          ? 'bg-[#95D2B3] border-[#95D2B3] text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-[#95D2B3]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    title="Next"
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    title="Last"
                  >
                    &raquo;
                  </button>
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