import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { emotionImages } from '../../../utils/moods';
import { generateMoodAnalysisPDF } from '../PDFTemplates/AnalysisPDF';
import Sidebar from './Sidebar';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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

const AllMoodAnalysis = ({ isDashboard = false, teacher: propTeacher }) => {
  const [teacher, setTeacher] = useState(propTeacher || null);
  const [allMoodLogs, setAllMoodLogs] = useState([]);
  const [moodType, setMoodType] = useState('after');
  const [moodPeriod, setMoodPeriod] = useState('monthly');
  const [selectedSection, setSelectedSection] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState(['All', ...(propTeacher?.assignedSections || [])]);

  useEffect(() => {
    if (!teacher) {
      fetchTeacherProfile();
    }
  }, [teacher]);

  useEffect(() => {
    if (propTeacher) {
      setTeacher(propTeacher);
      setSections(['All', ...(propTeacher.assignedSections || [])]);
      if (!selectedSection) {
        setSelectedSection('All');
      }
    }
  }, [propTeacher]);

  useEffect(() => {
    if (selectedSection) {
      fetchMoodLogsForSection(selectedSection);
    }
  }, [selectedSection]);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/teacher/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeacher(response.data.data);
        setSections(['All', ...(response.data.data.assignedSections || [])]);
        setSelectedSection('All');
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

  const handleDownloadPDF = async () => {
    try {
      await generateMoodAnalysisPDF(selectedSection, moodType, moodPeriod, currentMoodCounts, sortedMoods);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

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
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      } else {
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      }
    });
  }, [allMoodLogs, moodPeriod]);

  const currentMoodCounts = useMemo(() => {
    const countMap = {};
    filteredMoodLogs.forEach(log => {
      const emotion = moodType === 'before' ? log.beforeEmotion : log.afterEmotion;
      if (emotion) {
        const lowerEmotion = emotion.toLowerCase();
        if (!countMap[lowerEmotion]) countMap[lowerEmotion] = 0;
        countMap[lowerEmotion]++;
      }
    });
    return countMap;
  }, [filteredMoodLogs, moodType]);

  const sortedMoods = useMemo(() =>
    Object.keys(currentMoodCounts).sort((a, b) => currentMoodCounts[b] - currentMoodCounts[a]),
    [currentMoodCounts]
  );

  const chartData = useMemo(() => ({
    labels: Object.keys(currentMoodCounts).map(capitalizeText),
    datasets: [
      {
        data: Object.values(currentMoodCounts),
        backgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion] || '#95A5A6'),
        hoverBackgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion] || '#95A5A6'),
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
            const label = context.label || '';
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

  const content = (
    <div className={`${isDashboard ? '' : 'p-8'}`}>
      {loading && !isDashboard ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`bg-white rounded-3xl ${isDashboard ? '' : 'shadow-sm border border-gray-100 overflow-hidden mb-8'}`}
        >
          <div className={`${isDashboard ? 'p-4' : 'p-8'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl">
                  <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
                </div>
                <div>
                  <h2 className={`${isDashboard ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#272829' }}>Mood Analysis</h2>
                  {!isDashboard && <p className="text-gray-600">Track emotions from your section before and after activities</p>}
                </div>
              </div>
              {Object.keys(currentMoodCounts).length > 0 && (
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                  title="Download PDF"
                >
                  <FileDownloadIcon style={{ fontSize: isDashboard ? '24px' : '32px' }} />
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 flex-wrap items-center">
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

              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                {['before', 'after'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMoodType(type)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                      moodType === type
                        ? 'bg-white text-[#55AD9B] shadow-md'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMoodPeriod(type)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                      moodPeriod === type
                        ? 'bg-white text-[#55AD9B] shadow-md'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className={`relative ${isDashboard ? 'w-64 h-64' : 'w-80 h-80'} my-6`}>
                {Object.keys(currentMoodCounts).length > 0 ? (
                  <Doughnut data={chartData} options={chartOptions} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2 opacity-50">😐</div>
                      <p className="text-gray-500 italic">No mood data</p>
                    </div>
                  </div>
                )}
              </div>

              {Object.keys(currentMoodCounts).length > 0 && (
                <div className={`mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full ${isDashboard ? '' : 'max-w-2xl'}`}>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {Object.values(currentMoodCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {sortedMoods[0] ? capitalizeText(sortedMoods[0]) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Top</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {Object.keys(currentMoodCounts).length}
                    </div>
                    <div className="text-sm text-gray-600">Emotions</div>
                  </div>
                </div>
              )}

              <div className="w-full flex justify-center mt-6">
                <div className="flex flex-wrap justify-center gap-4 max-w-5xl">
                  {sortedMoods.map((emotion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 transform"
                      style={{
                        backgroundColor: emotionColors[emotion] || '#95A5A6',
                        borderColor: emotionColors[emotion] || '#95A5A6',
                        minWidth: isDashboard ? '100px' : '140px',
                        width: isDashboard ? '100px' : '140px'
                      }}
                    >
                      <div className="mb-2">
                        <img
                          src={emotionImages[emotion]}
                          alt={emotion}
                          style={{ width: isDashboard ? '32px' : '48px', height: isDashboard ? '32px' : '48px', objectFit: 'contain' }}
                        />
                      </div>
                      <p className="font-semibold capitalize text-xs text-center" style={{ color: '#e9eaeaff' }}>
                        {capitalizeText(emotion)}
                      </p>
                      <p className="font-bold text-sm mt-1" style={{ color: '#e9eaeaff' }}>
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
    </div>
  );

  if (isDashboard) return content;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar teacher={teacher} />
      <div className="flex-1 ml-72">
        {content}
      </div>
    </div>
  );
};

export default AllMoodAnalysis;
