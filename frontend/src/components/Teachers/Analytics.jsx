import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { emotionImages } from '../../../utils/moods';
import { generateMoodAnalysisPDF, generateWeeklyLogsPDF } from '../PDFTemplates/AnalysisPDF';
import Sidebar from './Sidebar';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels, CategoryScale, LinearScale, PointElement, LineElement);

const emotionColors = {
  'calm': '#8FABD4',
  'relaxed': '#59AC77',
  'pleased': '#FF714B',
  'happy': '#f7b40bff',
  'excited': '#F564A9',
  'bored': '#A9A9A9',
  'sad': '#092b9cff',
  'disappointed': '#4e4d4dff',
  'angry': '#cc062dff',
  'tense': '#a854a8ff'
};

const capitalizeText = (text) => {
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const TeacherAnalytics = () => {
  const [teacher, setTeacher] = useState(null);
  const [allMoodLogs, setAllMoodLogs] = useState([]);
  const [moodType, setMoodType] = useState('after');
  const [moodPeriod, setMoodPeriod] = useState('monthly');
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [weeklyLogsData, setWeeklyLogsData] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMondayOfCurrentWeek());
  const [weeklyLogsLoading, setWeeklyLogsLoading] = useState(false);

  function getMondayOfCurrentWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.setDate(diff));
  }

  function getFormattedDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchMoodLogsForSection(selectedSection);
      fetchWeeklyLogs(selectedSection);
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection) {
      fetchWeeklyLogs(selectedSection);
    }
  }, [currentWeekStart]);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeacher(response.data.data);
        setSections(response.data.data.assignedSections || []);
        // Set the first section as default
        if (response.data.data.assignedSections?.length > 0) {
          setSelectedSection(response.data.data.assignedSections[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      toast.error('Failed to fetch teacher profile');
    }
  };

  const fetchMoodLogsForSection = async (section) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/mood-logs/${encodeURIComponent(section)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setAllMoodLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      toast.error('Failed to fetch mood logs');
      setAllMoodLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyLogs = async (section) => {
    try {
      setWeeklyLogsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/weekly-logs/${encodeURIComponent(section)}`,
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

  const handleDownloadPDF = async () => {
    try {
      await generateMoodAnalysisPDF(selectedSection, moodType, moodPeriod, currentMoodCounts, sortedMoods);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadWeeklyPDF = async () => {
    try {
      await generateWeeklyLogsPDF(selectedSection, weeklyLogsData, currentWeekStart);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading weekly logs PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Filter mood logs based on selected period
  const filteredMoodLogs = useMemo(() => {
    const now = new Date();
    return allMoodLogs.filter(log => {
      const logDate = new Date(log.date);
      if (moodPeriod === 'daily') {
        return (
          logDate.getDate() === now.getDate() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      } else if (moodPeriod === 'weekly') {
        // Week starts on Monday
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      } else {
        // monthly
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      }
    });
  }, [allMoodLogs, moodPeriod]);

  // Calculate mood counts based on logs, type, and period
  const currentMoodCounts = useMemo(() => {
    const countMap = {};
    filteredMoodLogs.forEach(log => {
      const emotion = moodType === 'before' ? log.beforeEmotion : log.afterEmotion;
      if (emotion) {
        if (!countMap[emotion]) countMap[emotion] = 0;
        countMap[emotion]++;
      }
    });
    return countMap;
  }, [filteredMoodLogs, moodType]);

  const sortedMoods = useMemo(() =>
    Object.keys(currentMoodCounts).sort((a, b) => currentMoodCounts[b] - currentMoodCounts[a]),
    [currentMoodCounts]
  );

  const chartData = useMemo(() => ({
    labels: Object.keys(currentMoodCounts),
    datasets: [
      {
        data: Object.values(currentMoodCounts),
        backgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        hoverBackgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderColor: '#fff'
      }
    ]
  }), [currentMoodCounts]);

  const chartOptions = {
    cutout: '60%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#55AD9B',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = capitalizeText(context.label || '');
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} entries (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#f6f4f4ff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return `${percentage}%`;
        }
      }
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar teacher={teacher} />
      <div className="flex-1 ml-72">
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading analytics...</div>
            </div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl">
                      <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Mood Analysis</h2>
                      <p className="text-gray-600">Track emotions from your section before and after activities</p>
                    </div>
                  </div>
                  {Object.keys(currentMoodCounts).length > 0 && (
                    <button
                      onClick={handleDownloadPDF}
                      className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                      title="Download PDF"
                    >
                      <FileDownloadIcon style={{ fontSize: '32px' }} />
                    </button>
                  )}
                </div>
                
                {/* Controls - Inline with Section Selection */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 flex-wrap items-center">
                  {/* Section Selection */}
                  {sections.length > 0 && (
                    <select
                      value={selectedSection || ''}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 focus:outline-none focus:border-[#55AD9B] font-medium text-sm"
                    >
                      {sections.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Before/After Toggle */}
                  <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                    <button
                      onClick={() => setMoodType('before')}
                      className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                        moodType === 'before'
                          ? 'bg-[#55AD9B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Before Activity
                    </button>
                    <button
                      onClick={() => setMoodType('after')}
                      className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                        moodType === 'after'
                          ? 'bg-[#55AD9B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      After Activity
                    </button>
                  </div>

                  {/* Period Toggle */}
                  <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                    <button
                      onClick={() => setMoodPeriod('daily')}
                      className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                        moodPeriod === 'daily'
                          ? 'bg-[#55AD9B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setMoodPeriod('weekly')}
                      className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                        moodPeriod === 'weekly'
                          ? 'bg-[#55AD9B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setMoodPeriod('monthly')}
                      className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                        moodPeriod === 'monthly'
                          ? 'bg-[#55AD9B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-80 h-80 my-6">
                    {Object.keys(currentMoodCounts).length > 0 ? (
                      <Doughnut data={chartData} options={chartOptions} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-full">
                        <div className="text-center">
                          <div className="text-4xl mb-2 opacity-50">😐</div>
                          <p className="text-gray-500 italic">No mood data available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Stats */}
                  {Object.keys(currentMoodCounts).length > 0 && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                          {Object.values(currentMoodCounts).reduce((a, b) => a + b, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Entries</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                          {sortedMoods[0] ? capitalizeText(sortedMoods[0]) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Most Frequent</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                          {Object.keys(currentMoodCounts).length}
                        </div>
                        <div className="text-sm text-gray-600">Unique Emotions</div>
                      </div>
                    </div>
                  )}

                  {/* Centered Mood Legend with Color Coding */}
                  <div className="w-full flex justify-center mt-6">
                    <div className="flex flex-wrap justify-center gap-4 max-w-5xl">
                      {sortedMoods.map((emotion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 transform"
                          style={{
                            backgroundColor: emotionColors[emotion.toLowerCase()] || '#95A5A6',
                            borderColor: emotionColors[emotion.toLowerCase()] || '#95A5A6',
                            minWidth: '140px',
                            width: '140px'
                          }}
                        >
                          <div className="mb-3">
                            <img
                              src={emotionImages[emotion.toLowerCase()]}
                              alt={emotion}
                              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                            />
                          </div>
                          <p className="font-semibold capitalize text-sm text-center" style={{ color: '#e9eaeaff' }}>
                            {capitalizeText(emotion)}
                          </p>
                          <p className="font-bold text-lg mt-1" style={{ color: '#e9eaeaff' }}>
                            {currentMoodCounts[emotion]}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Weekly Logs by Category Chart */}
          {selectedSection && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl">
                      <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Weekly Logs by Category</h2>
                      <p className="text-gray-600">Track activity, health, social, and sleep logs throughout the week</p>
                    </div>
                  </div>
                  {weeklyLogsData && (
                    <button
                      onClick={handleDownloadWeeklyPDF}
                      className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                      title="Download PDF"
                    >
                      <FileDownloadIcon style={{ fontSize: '32px' }} />
                    </button>
                  )}
                </div>

                {/* Week Date Display */}
                <div className="text-center text-xs text-gray-400 mb-6">
                  {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Chart */}
                {weeklyLogsLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="text-gray-500">Loading weekly data...</div>
                  </div>
                ) : weeklyLogsData ? (
                  <>
                    <div className="h-96 w-full" id="weekly-logs-by-category-chart">
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
                  <div className="flex justify-center items-center h-80">
                    <div className="text-gray-500">No data available for this week</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
