import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { generateCategoricalLogsPDF } from '../PDFTemplates/AnalysisPDF';
import Sidebar from './Sidebar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const CategoricalLogs = ({ isDashboard = false, teacher: propTeacher }) => {
  const [teacher, setTeacher] = useState(propTeacher || null);
  const [selectedSection, setSelectedSection] = useState('All');
  const [sections, setSections] = useState(['All', ...(propTeacher?.assignedSections || [])]);
  const [logsData, setLogsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('weekly');

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
      fetchLogs(selectedSection);
    }
  }, [selectedSection, viewType]);

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

  const fetchLogs = async (section) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_NODE_API}/api/teacher/categorical-logs/${encodeURIComponent(section)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { viewType }
        }
      );
      
      if (response.data.success) {
        setLogsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categorical logs:', error);
      setLogsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const dateRange = logsData.labels.length > 0 
        ? `${logsData.labels[0]} - ${logsData.labels[logsData.labels.length - 1]}`
        : "";
      await generateCategoricalLogsPDF(selectedSection, logsData, dateRange, viewType);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const content = (
    <div className={`${isDashboard ? '' : 'p-8'}`}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`bg-white rounded-3xl ${isDashboard ? '' : 'shadow-sm border border-gray-100 overflow-hidden'}`}
      >
        <div className={`${isDashboard ? 'p-4' : 'p-8'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl">
                <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
              </div>
              <div>
                <h2 className={`${isDashboard ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: '#272829' }}>Categorical Logs</h2>
                {!isDashboard && <p className="text-gray-600">Track activity, health, social, and sleep logs throughout the period</p>}
              </div>
            </div>
            {logsData && (
              <button
                onClick={handleDownloadPDF}
                className="p-2 rounded-lg text-[#55AD9B] hover:bg-gray-100 transition-colors"
                title="Download PDF"
              >
                <FileDownloadIcon style={{ fontSize: isDashboard ? '24px' : '32px' }} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
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
              {['daily', 'weekly', 'monthly'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 capitalize ${
                    viewType === type 
                      ? 'bg-white text-[#55AD9B] shadow-md' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center mb-6">
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm uppercase tracking-widest">
              {viewType === 'weekly' ? (
                `Last 8 Weeks (${logsData?.labels?.[0]} — ${logsData?.labels?.[logsData.labels.length - 1]})`
              ) : viewType === 'daily' ? (
                `Past 30 Days (${logsData?.labels?.[0]} — ${logsData?.labels?.[logsData.labels.length - 1]})`
              ) : (
                `Last 12 Months (${logsData?.labels?.[0]} — ${logsData?.labels?.[logsData.labels.length - 1]})`
              )}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="text-gray-500">Loading data...</div>
            </div>
          ) : logsData ? (
            <div id="categorical-logs-chart" className={`${isDashboard ? 'h-64' : 'h-96'} w-full`}>
              <Line
                data={{
                  labels: logsData.labels,
                  datasets: [
                    {
                      label: 'Activity',
                      data: logsData.activity,
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
                      data: logsData.social,
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
                      data: logsData.health,
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
                      data: logsData.sleep,
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
                          size: 10,
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
                        stepSize: Math.max(1, Math.ceil(Math.max(...logsData.activity, ...logsData.health, ...logsData.social, ...logsData.sleep) / 5))
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
          ) : (
            <div className="flex justify-center items-center h-80">
              <div className="text-gray-500">No data available for this period</div>
            </div>
          )}
        </div>
      </motion.div>
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

export default CategoricalLogs;
