import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { generateStudentLogsPDF, generateSectionSummaryPDF } from '../PDFTemplates/StudentLogsPDF';
import TeacherSidebar from './Sidebar';

const SectionStudents = () => {
  const { section } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [imageErrorIds, setImageErrorIds] = useState({});

  useEffect(() => {
    fetchTeacherProfile();
    fetchSectionStudents();
  }, [section]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

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

  const fetchSectionStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const decodedSection = decodeURIComponent(section);
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/section-students/${encodeURIComponent(decodedSection)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudents(response.data.data);
      } else {
        toast.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching section students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleViewLogs = (studentId) => {
    window.location.href = `/teacher/student-logs/${studentId}`;
  };

  const handleDownloadStudentLogs = async (student) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/student-mood-logs/${student._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await generateStudentLogsPDF(student, response.data.data, section);
        toast.success('Student logs downloaded successfully!');
      } else {
        toast.error('Failed to fetch student logs');
      }
    } catch (error) {
      console.error('Error downloading student logs:', error);
      toast.error('Failed to download student logs');
    }
  };

  const handleDownloadSectionSummary = async () => {
    try {
      if (students.length === 0) {
        toast.error('No students to download');
        return;
      }
      await generateSectionSummaryPDF(section, students);
      toast.success('Section summary downloaded successfully!');
    } catch (error) {
      console.error('Error downloading section summary:', error);
      toast.error('Failed to download section summary');
    }
  };

  const getCategoryTotal = (student, category) => {
    return student.moodLogCounts?.[category] || 0;
  };

  const getTotalLogs = (student) => {
    const counts = student.moodLogCounts || {};
    return Object.values(counts).reduce((total, count) => total + count, 0);
  };

  // Handle image error for fallback avatar
  const handleImageError = (id) => {
    setImageErrorIds(prev => ({ ...prev, [id]: true }));
  };

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

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

  if (loading) {
    return (
      <div className="flex">
        <TeacherSidebar teacher={teacher} />
        <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F7] overflow-x-hidden">
      <TeacherSidebar teacher={teacher} />
      <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 p-6 min-w-0">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Students in Section: <span className="text-[#55AD9B]">{decodeURIComponent(section)}</span>
              </h1>
              <p className="text-base text-gray-600 mt-1">
                Total students: <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span>
              </p>
            </div>
            <button
              onClick={handleDownloadSectionSummary}
              className="inline-flex items-center px-4 py-2 bg-[#55AD9B] text-white rounded-md hover:bg-[#3e8e7e] transition-colors shadow-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Download Section Summary
            </button>
          </div>

          {/* Search and Per Page Controls */}
          <div className=" p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page:</span>
              <select
                value={studentsPerPage}
                onChange={e => {
                  setStudentsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <button
                onClick={() => setSearchTerm('')}
                className="px-2 py-1 bg-[#55AD9B] text-white rounded-md hover:bg-[#3e8e7e] transition-colors text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Activity Logs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Social Logs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Health Logs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Sleep Logs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Logs
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {student.avatar && !imageErrorIds[student._id] ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={student.avatar}
                                alt={student.name}
                                onError={() => handleImageError(student._id)}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#6d8fd7]">
                                <span className="text-lg font-bold text-white">
                                  {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-semibold text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-medium text-gray-900">
                          {getCategoryTotal(student, 'activity')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-medium text-gray-900">
                          {getCategoryTotal(student, 'social')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-medium text-gray-900">
                          {getCategoryTotal(student, 'health')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-medium text-gray-900">
                          {getCategoryTotal(student, 'sleep')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-md font-semibold text-[#55AD9B]">
                          {getTotalLogs(student)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewLogs(student._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-md leading-5 font-medium rounded-md text-black bg-white"
                          >
                            View Logs
                          </button>
                          <button
                            onClick={() => handleDownloadStudentLogs(student)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-[#55AD9B] hover:bg-[#3e8e7e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#55AD9B] transition-colors"
                            title="Download student logs as PDF"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentStudents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-2xl mb-2">👥</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No students found</h3>
                <p className="text-lg text-gray-500">
                  {searchTerm ? 'Try adjusting your search term.' : 'No students assigned to this section yet.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                <div className="mb-2 sm:mb-0 text-sm text-gray-700">
                  Showing <span className="font-semibold">{indexOfFirstStudent + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(indexOfLastStudent, filteredStudents.length)}
                  </span> of{' '}
                  <span className="font-semibold">{filteredStudents.length}</span> results
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
                      className={`px-2 py-1 rounded-md border text-sm font-medium ${
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

export default SectionStudents;