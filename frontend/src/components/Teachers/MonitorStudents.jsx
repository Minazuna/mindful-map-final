import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Avatar, Chip, Tooltip, IconButton, CircularProgress, Button
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { generateStudentsSeverityPDF } from '../PDFTemplates/StudentsServerityPDF';

// Helper to get current week's Monday-Sunday range
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0); // Set to start of day

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999); // Set to end of day

  return {
    start: monday,
    end: sunday,
    label: `${formatDateWord(monday)} - ${formatDateWord(sunday)}`
  };
}

// Format date as "Jan. 05"
function formatDateWord(date) {
  const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

// Color coordination for risk levels
const severityColors = {
  high: { bg: 'linear-gradient(90deg,#ef4444,#f87171)', color: '#fff', chip: '#ef4444' },
  moderate: { bg: 'linear-gradient(90deg,#fde68a,#fbbf24)', color: '#7c4700', chip: '#fbbf24' },
  low: { bg: 'linear-gradient(90deg,#bbf7d0,#34d399)', color: '#065f46', chip: '#34d399' },
};

const severityIcons = {
  high: <HelpOutlineIcon sx={{ color: '#fff', fontSize: 24, background: '#ef4444', borderRadius: '50%', p: 0.5 }} />,
  moderate: <HelpOutlineIcon sx={{ color: '#f59e42', fontSize: 24, background: '#fde68a', borderRadius: '50%', p: 0.5 }} />,
  low: <HelpOutlineIcon sx={{ color: '#34d399', fontSize: 24, background: '#bbf7d0', borderRadius: '50%', p: 0.5 }} />,
};

const severityLabels = {
  high: 'High Risk',
  moderate: 'Moderate Risk',
  low: 'Low Risk',
};

const allSections = [
  'St. John Paul II (STEM 1)',
  'St. Paul VI (STEM 2)',
  'St. John XXIII (STEM 3)',
  'St. Pius X (HUMSS)',
  'St. Tarcisius (ABM)',
  'St. Jose Sanchez Del Rio (ICT)'
];

const MonitorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [sections, setSections] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  // Get current week range
  const weekRange = getCurrentWeekRange();

  // Filtered students
  const filteredStudents = students.filter(student =>
    student.studentId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/teacher/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          const secs = res.data.data.assignedSections || [];
          setSections(secs);
          if (secs.length) setSelectedSection(secs[0]);
        }
      } catch {
        setSections([]);
      }
    };
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
const fetchSeverity = async () => {
  if (!selectedSection) return;
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    // 1. Compute severity for the section/week
    await axios.post(
      `${import.meta.env.VITE_NODE_API}/api/teacher/compute-section-severity/${encodeURIComponent(selectedSection)}?weekStart=${weekRange.start.toISOString()}&weekEnd=${weekRange.end.toISOString()}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // 2. Fetch computed severity
    const res = await axios.get(
      `${import.meta.env.VITE_NODE_API}/api/teacher/section-severity/${encodeURIComponent(selectedSection)}?weekStart=${weekRange.start.toISOString()}&weekEnd=${weekRange.end.toISOString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStudents(res.data.data || []);
  } catch (err) {
    setStudents([]);
  }
  setLoading(false);
};
    fetchSeverity();
  }, [selectedSection, refresh]);

  // Download PDF handler
  const handleDownloadReport = async (student) => {
    setDownloadingId(student.studentId._id);
    try {
      const token = localStorage.getItem('token');
      // Get full severity details for the student for this week
      const detailsRes = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/student-severity-details?studentId=${student.studentId._id}&sectionId=${encodeURIComponent(student.sectionId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Get status history
      const historyRes = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/severity-status-history?studentId=${student.studentId._id}&sectionId=${encodeURIComponent(student.sectionId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await generateStudentsSeverityPDF(
        detailsRes.data.data,
        {
          section: student.sectionId,
          weekStart: weekRange.start.toISOString(),
          weekEnd: weekRange.end.toISOString(),
          statusHistory: historyRes.data.data || []
        }
      );
    } catch (err) {
      alert('Failed to generate PDF report.');
    }
    setDownloadingId(null);
  };

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, studentsPerPage]);

  return (
    <div className="w-screen min-h-screen bg-[#F7F7F7]">
      <div className="flex min-h-screen">
        <Sidebar active="monitor" />
        <div className="flex-1 ml-72 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-2">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Monitor Students
              </h1>
            </div>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-6 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  className="border rounded px-3 py-2 min-w-[220px]"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  {sections.length > 0
                    ? sections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))
                    : allSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Week</label>
                <div className="font-semibold text-[#1F8E8E]">{weekRange.label}</div>
              </div>
            </div>
            {/* Student Count, Search, Per Page, Clear */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-lg text-gray-700 font-medium">
                Total students: <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span>
              </div>
              <div className="flex flex-1 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#55AD9B] text-base"
                  style={{ minWidth: 0 }}
                />
                <span className="text-sm text-gray-600">Per page:</span>
                <select
                  value={studentsPerPage}
                  onChange={e => setStudentsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#55AD9B]"
                  style={{ width: 60 }}
                >
                  {[10, 25, 50, 100].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-[#55AD9B] text-white rounded-md hover:bg-[#3e8e7e] transition-colors text-sm font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Clear
                </button>
              </div>
            </div>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="flex justify-center items-center py-32">
                            <CircularProgress color="success" />
                          </div>
                        </td>
                      </tr>
                    ) : !selectedSection ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="flex flex-col items-center justify-center py-32">
                            <InfoIcon sx={{ fontSize: 40, color: '#55AD9B' }} />
                            <p className="text-gray-600 mt-2">Please select a section to view students.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="flex flex-col items-center justify-center py-32">
                            <InfoIcon sx={{ fontSize: 40, color: '#55AD9B' }} />
                            <p className="text-gray-600 mt-2">No severity data available for this section and week.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentStudents.map((student, idx) => (
                        <tr key={student.studentId._id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {student.studentId.avatar ? (
                                  <Avatar src={student.studentId.avatar} alt={student.studentId.firstName} sx={{ width: 40, height: 40, bgcolor: '#55AD9B', fontWeight: 700, fontSize: 20 }} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#6d8fd7]">
                                    <span className="text-lg font-bold text-white">
                                      {student.studentId.firstName ? student.studentId.firstName.charAt(0).toUpperCase() : '?'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-base font-semibold text-gray-900">
                                  {student.studentId.firstName} {student.studentId.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.studentId.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Chip
                              icon={severityIcons[student.severityLevel]}
                              label={severityLabels[student.severityLevel]}
                              sx={{
                                background: severityColors[student.severityLevel]?.bg,
                                color: severityColors[student.severityLevel]?.color,
                                fontWeight: 'bold',
                                fontSize: 15,
                                px: 2,
                                boxShadow: 1,
                                minWidth: 120
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                onClick={() => navigate(`/monitor-students-details?studentId=${student.studentId._id}&sectionId=${student.sectionId}&weekStart=${weekRange.start.toISOString()}&weekEnd=${weekRange.end.toISOString()}`)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-md leading-5 font-medium rounded-md text-black bg-white"
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 500,
                                  minWidth: 0,
                                  boxShadow: 'none'
                                }}
                              >
                                View Risk Details
                              </button>
                              <button
                                onClick={() => handleDownloadReport(student)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-md leading-5 font-medium rounded-md text-white bg-[#55AD9B] hover:bg-[#3e8e7e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#55AD9B] transition-colors"
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 500,
                                  minWidth: 0,
                                  boxShadow: 'none'
                                }}
                                disabled={downloadingId === student.studentId._id}
                                title="Download severity report as PDF"
                              >
                                {downloadingId === student.studentId._id ? (
                                  <CircularProgress size={18} color="inherit" className="mr-1" />
                                ) : (
                                  <DownloadIcon sx={{ fontSize: 20, mr: 1 }} />
                                )}
                                Download 
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
};

export default MonitorStudents;