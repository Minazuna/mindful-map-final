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
    const fetchMonthlyUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/monthly-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Calculate total users (will exclude admins on backend level later)
        const totalUsers = response.data.reduce((acc, data) => acc + data.count, 0);
        setMonthlyUsers(totalUsers);
        setMonthlyUserData(response.data);
      } catch (error) {
        console.error('Error fetching monthly users:', error);
      }
    };
  
    const fetchActiveStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Count active students (users endpoint already filters role: 'user' and includes status)
        const activeStudents = response.data.filter(user => user.status === 'Active');
        setActiveStudentsCount(activeStudents.length);
      } catch (error) {
        console.error('Error fetching active students:', error);
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
        setInactiveStudentsCount(inactiveStudents);
      } catch (error) {
        console.error('Error fetching active vs inactive students:', error);
      }
    };

    const fetchTeachersCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/teachers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeachersCount(response.data.count || response.data.data?.length || 0);
      } catch (error) {
        console.error('Error fetching teachers count:', error);
      }
    };

    const fetchStudentsCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // users endpoint already filters for role: 'user'
        setStudentsCount(response.data.length);
      } catch (error) {
        console.error('Error fetching students count:', error);
      }
    };

    const fetchWeeklyLogs = async () => {
      try {
        setWeeklyLogsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/admin/weekly-logs-by-category`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { weekStartDate: getFormattedDate(currentWeekStart) }
          }
        );
        
        if (response.data.success) {
          setWeeklyLogsData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching weekly logs:', error);
        setWeeklyLogsData(null);
      } finally {
        setWeeklyLogsLoading(false);
      }
    };
  
    fetchMonthlyUsers();
    fetchActiveStudents();
    fetchDailyMoodLogs();
    fetchDailyJournalLogs();
    fetchActiveVsInactiveStudents();
    fetchTeachersCount();
    fetchStudentsCount();
    fetchWeeklyLogs();
  }, [currentWeekStart]);

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
        backgroundColor: 'rgba(100, 170, 134, 0.2)',
        fill: true,
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
        backgroundColor: 'rgba(100, 170, 134, 0.2)',
        fill: true,
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
      currentWeekStart
    };
    generatePDF(chartId, title, data);
  };
  
  return (
    <div className="flex min-h-screen bg-[#F8FAF9]">
      <div className="w-1/5">
        <Navbar />
      </div>

      <div className="flex-grow p-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36">
            <ShowChartIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Total Users</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{monthlyUsers}</p>
            </div>
          </div>
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36">
            <SchoolIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Teachers</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{teachersCount}</p>
            </div>
          </div>
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36">
            <PersonIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Students</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{studentsCount}</p>
            </div>
          </div>
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36">
            <TaskAltIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Active Students</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{activeStudentsCount}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36">
            <BlockIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Inactive Students</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{inactiveStudentsCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6">
          <div id="monthly-users-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 max-w-4xl">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Monthly Users</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => handleGeneratePDF('monthly-users-chart', 'Monthly Users')}
              />
            </div>
            <div className="h-64">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="grid grid-cols-1 gap-4 w-full max-w-6xl">
            <div id="active-vs-inactive-students-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6">
              <h2 className="text-[#292f33] font-bold text-xl mb-4">Active and Inactive Students</h2>
              <div className="absolute top-2 right-2">
                <DownloadIcon
                  className="text-[#64aa86] cursor-pointer"
                  style={{ fontSize: '20px' }}
                  onClick={() => handleGeneratePDF('active-vs-inactive-students-chart', 'Active vs Inactive Students')}
                />
              </div>
              <div className="h-64">
                <Pie data={activeVsInactiveStudentsChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>
          <div id="daily-mood-logs-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 w-full max-w-6xl mt-6">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Daily Mood Logs</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => handleGeneratePDF('daily-mood-logs-chart', 'Daily Mood Logs')}
              />
            </div>
            <div className="h-64">
              <Line data={dailyMoodLogsChartData} options={lineChartOptions} />
            </div>
            <div className="flex justify-center mt-2">
              <button className="text-[#64aa86] mx-2" onClick={() => setMoodLogsPage(moodLogsPage > 0 ? moodLogsPage - 1 : 0)}>&lt;</button>
              <button className="text-[#64aa86] mx-2" onClick={() => setMoodLogsPage(moodLogsPage < Math.ceil(dailyMoodLogsData.length / 10) - 1 ? moodLogsPage + 1 : moodLogsPage)}>&gt;</button>
            </div>
          </div>
          <div id="daily-journal-logs-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 w-full max-w-6xl mt-6">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Daily Journal Logs</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => handleGeneratePDF('daily-journal-logs-chart', 'Daily Journal Logs')}
              />
            </div>
            <div className="h-64">
              <Line data={dailyJournalLogsChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Weekly Logs by Category Chart */}
          <div className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 w-full max-w-6xl mt-6">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Weekly Logs by Category</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => handleGeneratePDF('weekly-logs-by-category-chart', 'Weekly Logs by Category')}
              />
            </div>
            
            {/* Week Date Display */}
            <div className="text-center text-xs text-gray-400 mb-6">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Chart */}
            {weeklyLogsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading weekly data...</div>
              </div>
            ) : weeklyLogsData ? (
              <>
                <div id="weekly-logs-by-category-chart" className="h-64">
                  <Line
                    data={{
                      labels: weeklyLogsData.days,
                      datasets: [
                        {
                          label: 'Activity',
                          data: weeklyLogsData.activity,
                          borderColor: '#4A90E2',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          pointBackgroundColor: '#4A90E2',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                        },
                        {
                          label: 'Social',
                          data: weeklyLogsData.social,
                          borderColor: '#E85D75',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          pointBackgroundColor: '#E85D75',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                        },
                        {
                          label: 'Health',
                          data: weeklyLogsData.health,
                          borderColor: '#2FCC71',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          pointBackgroundColor: '#2FCC71',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                        },
                        {
                          label: 'Sleep',
                          data: weeklyLogsData.sleep,
                          borderColor: '#F39C12',
                          borderWidth: 2.5,
                          fill: false,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          pointBackgroundColor: '#F39C12',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
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
                            padding: 15,
                            font: {
                              size: 12,
                              weight: 'bold'
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          titleColor: '#333',
                          bodyColor: '#333',
                          borderColor: '#55AD9B',
                          borderWidth: 1,
                          cornerRadius: 8,
                          padding: 10
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: Math.max(1, Math.ceil(Math.max(...weeklyLogsData.activity, ...weeklyLogsData.health, ...weeklyLogsData.social, ...weeklyLogsData.sleep) / 5))
                          },
                          grid: {
                            color: 'rgba(200, 200, 200, 0.2)'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(200, 200, 200, 0.2)'
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Navigation Buttons Below Chart */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={handlePreviousWeek}
                    className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                    title="Previous Week"
                  >
                    <NavigateBeforeIcon style={{ fontSize: '32px' }} />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                    title="Next Week"
                  >
                    <NavigateNextIcon style={{ fontSize: '32px' }} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">No data available for this week</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
