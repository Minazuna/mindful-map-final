import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BlockIcon from '@mui/icons-material/Block';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { generatePDF } from '../PDFTemplates/DashboardPDFs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [monthlyUsers, setMonthlyUsers] = useState(0);
  const [monthlyUserData, setMonthlyUserData] = useState([]);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [inactiveStudentsCount, setInactiveStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [dailyMoodLogsData, setDailyMoodLogsData] = useState([]);
  const [dailyJournalLogsData, setDailyJournalLogsData] = useState([]);
  const [activeVsInactiveStudentsData, setActiveVsInactiveStudentsData] = useState({ active: 0, inactive: 0 });
  const [moodLogsPage, setMoodLogsPage] = useState(0);
  const [weeklyLogsData, setWeeklyLogsData] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMondayOfCurrentWeek());
  const [weeklyLogsLoading, setWeeklyLogsLoading] = useState(false);
  const [viewType, setViewType] = useState('weekly');

  function getMondayOfCurrentWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  function getFormattedDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMonthlyUsers(response.data.data.totalUsers);
        setTeachersCount(response.data.data.totalTeachers);
        setStudentsCount(response.data.data.totalStudents);
        setActiveStudentsCount(response.data.data.activeStudents);
        setInactiveStudentsCount(response.data.data.inactiveStudents);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    const fetchMonthlyUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/monthly-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMonthlyUserData(response.data);
      } catch (error) {
        console.error('Error fetching monthly users:', error);
      }
    };
  
    const fetchDailyMoodLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/daily-mood-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDailyMoodLogsData(response.data);
      } catch (error) {
        console.error('Error fetching daily mood logs:', error);
      }
    };
  
    const fetchDailyJournalLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/daily-journal-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDailyJournalLogsData(response.data);
      } catch (error) {
        console.error('Error fetching daily journal logs:', error);
      }
    };
  
    const fetchActiveVsInactiveStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch active students
        const activeResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/active-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Fetch inactive students  
        const inactiveResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/inactive-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const activeStudents = activeResponse.data.length;
        const inactiveStudents = inactiveResponse.data.length;
        setActiveVsInactiveStudentsData({ active: activeStudents, inactive: inactiveStudents });
      } catch (error) {
        console.error('Error fetching active vs inactive students:', error);
      }
    };

    const fetchLogsByCategory = async () => {
      try {
        setWeeklyLogsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/admin/logs-by-category`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { 
              viewType,
              weekStartDate: getFormattedDate(currentWeekStart),
              year: new Date().getFullYear()
            }
          }
        );
        
        if (response.data.success) {
          setWeeklyLogsData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching logs by category:', error);
        setWeeklyLogsData(null);
      } finally {
        setWeeklyLogsLoading(false);
      }
    };
  
    fetchDashboardStats();
    fetchMonthlyUsers();
    fetchDailyMoodLogs();
    fetchDailyJournalLogs();
    fetchActiveVsInactiveStudents();
    fetchLogsByCategory();
  }, [currentWeekStart, viewType]);

  const barChartData = {
    labels: monthlyUserData.map(data => data.month),
    datasets: [
      {
        label: '',
        data: monthlyUserData.map(data => data.count),
        backgroundColor: '#64aa86',
      },
    ],
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.raw;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const dailyMoodLogsChartData = {
    labels: dailyMoodLogsData.slice(moodLogsPage * 10, (moodLogsPage + 1) * 10).map(data => data.date),
    datasets: [
      {
        label: 'Mood Logs',
        data: dailyMoodLogsData.slice(moodLogsPage * 10, (moodLogsPage + 1) * 10).map(data => data.count),
        borderColor: '#64aa86',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const dailyJournalLogsChartData = {
    labels: dailyJournalLogsData.map(data => data.date),
    datasets: [
      {
        label: 'Journal Logs',
        data: dailyJournalLogsData.map(data => data.count),
        borderColor: '#64aa86',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.raw;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const activeVsInactiveStudentsChartData = {
    labels: ['Active Students', 'Inactive Students'],
    datasets: [
      {
        label: 'Students',
        data: [activeVsInactiveStudentsData.active, activeVsInactiveStudentsData.inactive],
        backgroundColor: ['#64aa86', '#f44336'],
      },
    ],
  };
  
  const pieChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.raw;
          },
        },
      },
    },
  };

  const handleGeneratePDF = (chartId, title) => {
    const data = {
      monthlyUsers,
      monthlyUserData,
      activeVsInactiveUsersData: activeVsInactiveStudentsData,
      dailyMoodLogsData,
      dailyJournalLogsData,
      weeklyLogsData,
      currentWeekStart,
      viewType
    };
    generatePDF(chartId, title, data);
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      <Navbar />

      <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 p-10 overflow-x-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight drop-shadow-lg">Admin Dashboard</h1>
          <p className="text-lg text-gray-700 font-medium">
            System Overview & Analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-200">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-3 shadow-sm border border-blue-50">
              <ShowChartIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{monthlyUsers}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-200">
            <div className="p-4 rounded-full bg-purple-100 text-purple-600 mb-3 shadow-sm border border-purple-50">
              <SchoolIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Teachers</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{teachersCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-200">
            <div className="p-4 rounded-full bg-green-100 text-green-600 mb-3 shadow-sm border border-green-50">
              <PersonIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Students</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{studentsCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-200">
            <div className="p-4 rounded-full bg-cyan-100 text-cyan-600 mb-3 shadow-sm border border-cyan-50">
              <TaskAltIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{activeStudentsCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform duration-200">
            <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-3 shadow-sm border border-rose-50">
              <BlockIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inactive</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{inactiveStudentsCount}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Monthly Registrations */}
          <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Monthly Registrations</h2>
                  <p className="text-base text-gray-500 mt-1 font-medium italic">New user growth overview</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('monthly-users-chart', 'Monthly User Registrations Report')}
                  className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100 shadow-sm hover:shadow group-hover:scale-110 active:scale-95"
                  title="Download Report"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <div className="p-8" id="monthly-users-chart">
              <div className="h-72">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Active vs Inactive Students */}
          <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Student Status Distribution</h2>
                  <p className="text-base text-gray-500 mt-1 font-medium italic">Activity participation analysis</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('active-vs-inactive-students-chart', 'Active vs Inactive Students Report')}
                  className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100 shadow-sm hover:shadow group-hover:scale-110 active:scale-95"
                  title="Download Report"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <div className="p-8 flex justify-center items-center" id="active-vs-inactive-students-chart">
              <div className="h-72 w-full">
                <Pie data={activeVsInactiveStudentsChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>

          {/* Daily Mood Logs */}
          <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Daily Mood Logs</h2>
                  <p className="text-base text-gray-500 mt-1 font-medium italic">Student emotional engagement</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('daily-mood-logs-chart', 'Daily Mood Logs')}
                  className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100 shadow-sm hover:shadow group-hover:scale-110 active:scale-95"
                  title="Download Report"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <div className="p-8" id="daily-mood-logs-chart">
              <div className="h-72">
                <Line data={dailyMoodLogsChartData} options={lineChartOptions} />
              </div>
              <div className="flex justify-center items-center mt-6 space-x-4">
                <button 
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 border border-gray-100 shadow-sm"
                  onClick={() => setMoodLogsPage(moodLogsPage > 0 ? moodLogsPage - 1 : 0)}
                  disabled={moodLogsPage === 0}
                >
                  <NavigateBeforeIcon />
                </button>
                <span className="text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  Page {moodLogsPage + 1}
                </span>
                <button 
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 border border-gray-100 shadow-sm"
                  onClick={() => setMoodLogsPage(moodLogsPage < Math.ceil(dailyMoodLogsData.length / 10) - 1 ? moodLogsPage + 1 : moodLogsPage)}
                  disabled={moodLogsPage >= Math.ceil(dailyMoodLogsData.length / 10) - 1}
                >
                  <NavigateNextIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Daily Journal Logs */}
          <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Daily Journal Logs</h2>
                  <p className="text-base text-gray-500 mt-1 font-medium italic">Reflection trends frequency</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF('daily-journal-logs-chart', 'Daily Journal Logs')}
                  className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100 shadow-sm hover:shadow group-hover:scale-110 active:scale-95"
                  title="Download Report"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>
            <div className="p-8" id="daily-journal-logs-chart">
              <div className="h-72">
                <Line data={dailyJournalLogsChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Categorical Logs - Full Width */}
        <div className="mt-10">
          <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Categorical Analytics</h2>
                </div>
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                  {['daily', 'weekly', 'monthly'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setViewType(type)}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                        viewType === type 
                          ? 'bg-white text-blue-600 shadow-md' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <div className="mx-2 w-px bg-gray-200 my-1"></div>
                  <button
                    onClick={() => handleGeneratePDF('weekly-logs-by-category-chart', 'Categorical Logs Report')}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Download Report"
                  >
                    <DownloadIcon sx={{ fontSize: 20 }} />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm uppercase tracking-widest">
                  {viewType === 'weekly' ? (
                    `Last 8 Weeks (${weeklyLogsData?.labels?.[0]} — ${weeklyLogsData?.labels?.[weeklyLogsData.labels.length - 1]})`
                  ) : viewType === 'daily' ? (
                    `Past 30 Days (${weeklyLogsData?.labels?.[0]} — ${weeklyLogsData?.labels?.[weeklyLogsData.labels.length - 1]})`
                  ) : (
                    `Last 12 Months (${weeklyLogsData?.labels?.[0]} — ${weeklyLogsData?.labels?.[weeklyLogsData.labels.length - 1]})`
                  )}
                </span>
              </div>
            </div>
            
            <div className="p-8">
              {weeklyLogsLoading ? (
                <div className="flex flex-col justify-center items-center h-80 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 font-medium">Analyzing data...</p>
                </div>
              ) : weeklyLogsData ? (
                <div id="weekly-logs-by-category-chart" className="h-96">
                  <Line
                    data={{
                      labels: weeklyLogsData.labels,
                      datasets: [
                        {
                          label: 'Activity',
                          data: weeklyLogsData.activity,
                          borderColor: '#4A90E2',
                          backgroundColor: 'transparent',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 8
                        },
                        {
                          label: 'Social',
                          data: weeklyLogsData.social,
                          borderColor: '#E85D75',
                          backgroundColor: 'transparent',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 8
                        },
                        {
                          label: 'Health',
                          data: weeklyLogsData.health,
                          borderColor: '#2FCC71',
                          backgroundColor: 'transparent',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 8
                        },
                        {
                          label: 'Sleep',
                          data: weeklyLogsData.sleep,
                          borderColor: '#F39C12',
                          backgroundColor: 'transparent',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 8
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 25,
                            font: { size: 12, weight: '700' }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          titleColor: '#1A202C',
                          bodyColor: '#4A5568',
                          borderColor: '#E2E8F0',
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 6,
                          usePointStyle: true,
                          callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${context.parsed.y} entries`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0, 0, 0, 0.03)' },
                          ticks: { font: { weight: '600' } }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { font: { weight: '600' } }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-80 space-y-4">
                  <div className="text-gray-300 text-6xl">📭</div>
                  <p className="text-gray-400 font-medium font-medium italic italic">No matching logs found for this timeframe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
