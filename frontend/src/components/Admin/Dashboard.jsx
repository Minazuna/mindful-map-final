import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment';

const Dashboard = () => {
  const navigate = useNavigate();
  const [monthlyUsers, setMonthlyUsers] = useState(0);
  const [monthlyUserData, setMonthlyUserData] = useState([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [dailyMoodLogsData, setDailyMoodLogsData] = useState([]);
  const [dailyJournalLogsData, setDailyJournalLogsData] = useState([]);
  const [weeklyCorrelationValuesData, setWeeklyCorrelationValuesData] = useState([]);
  const [activeVsInactiveUsersData, setActiveVsInactiveUsersData] = useState({ active: 0, inactive: 0 });
  const [moodLogsPage, setMoodLogsPage] = useState(0);

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
        setMonthlyUsers(response.data.reduce((acc, data) => acc + data.count, 0));
        setMonthlyUserData(response.data);
      } catch (error) {
        console.error('Error fetching monthly users:', error);
      }
    };
  
    const fetchActiveUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/active-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setActiveUsersCount(response.data.length);
      } catch (error) {
        console.error('Error fetching active users:', error);
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
  
    const fetchWeeklyCorrelationValues = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/weekly-correlation-values`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWeeklyCorrelationValuesData(response.data);
      } catch (error) {
        console.error('Error fetching weekly correlation values:', error);
      }
    };
  
    const fetchActiveVsInactiveUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/active-vs-inactive-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setActiveVsInactiveUsersData(response.data);
        setInactiveUsersCount(response.data.inactive);
      } catch (error) {
        console.error('Error fetching active vs inactive users:', error);
      }
    };
  
    fetchMonthlyUsers();
    fetchActiveUsers();
    fetchDailyMoodLogs();
    fetchDailyJournalLogs();
    fetchWeeklyCorrelationValues();
    fetchActiveVsInactiveUsers();
  }, []);

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

  const weeklyCorrelationValuesChartData = {
    labels: weeklyCorrelationValuesData.map(data => data.week),
    datasets: [
      {
        label: 'Weekly Correlation Values',
        data: weeklyCorrelationValuesData.map(data => data.count),
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

  const activeVsInactiveUsersChartData = {
    labels: ['Active Users', 'Inactive Users'],
    datasets: [
      {
        label: 'Users',
        data: [activeVsInactiveUsersData.active, activeVsInactiveUsersData.inactive],
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

  const generatePDF = (chartId, title) => {
    const input = document.querySelector(`#${chartId} canvas`);
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const logoWidth = 25; 
      const logoHeight = 25;
      const margin = 15;
      const lineY = 42;
      
      pdf.setFillColor(240, 247, 244);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, 5, pageWidth - 20, pageHeight - 10, 5, 5, 'F');
      
      const tupLogo = new Image();
      const rightLogo = new Image();
      tupLogo.src = '/images/tup.png';
      rightLogo.src = '/images/logo.png';
      
      Promise.all([
        new Promise((resolve, reject) => {
          tupLogo.onload = resolve;
          tupLogo.onerror = reject;
        }),
        new Promise((resolve, reject) => {
          rightLogo.onload = resolve;
          rightLogo.onerror = reject;
        })
      ]).then(() => {
        pdf.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
        const rightLogoX = pageWidth - margin - logoWidth;
        pdf.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
        
        const textStart = margin + logoWidth + 10;
        const textWidth = rightLogoX - textStart;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
        const universityX = textStart + (textWidth - pdf.getTextWidth(universityName)) / 2 - 5;
        pdf.text(universityName, universityX, 20);
        
        pdf.setFontSize(11);
        const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
        const programX = textStart + (textWidth - pdf.getTextWidth(program)) / 2 - 5;
        pdf.text(program, programX, 27);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
        const addressX = textStart + (textWidth - pdf.getTextWidth(address)) / 2 - 5;
        pdf.text(address, addressX, 34);
        
        pdf.setLineWidth(0.8);
        pdf.setDrawColor(100, 179, 138);  
        pdf.line(35, lineY, pageWidth - 35, lineY);
        
        pdf.setFontSize(16);
        pdf.setTextColor(60, 107, 82);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, lineY + 20);
        
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(100, 179, 138);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(25, 65, 160, 90, 3, 3, 'FD');
        
        pdf.addImage(imgData, 'PNG', 35, 70, 140, 80);
        
        let summaryText = generateSummaryText(chartId);
        
        pdf.setFillColor(240, 247, 244);
        pdf.roundedRect(margin, 160, pageWidth - (margin * 2), 90, 3, 3, 'F');
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 107, 82);
        pdf.text("Summary", margin, 166);
        
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(100, 179, 138, 0.5);
        pdf.line(margin, 170, pageWidth - margin, 170);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(50, 50, 50);
        
        const maxWidth = pageWidth - (2 * margin) - 10;
        const splitText = pdf.splitTextToSize(summaryText, maxWidth);
        
        for (let i = 0; i < splitText.length; i++) {
          const textY = 178 + (i * 7);
          pdf.text(splitText[i], margin + 5, textY, { align: 'justify' });
        }
        
        pdf.setFillColor(240, 247, 244);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        const today = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        pdf.text(`Generated on: ${today}`, margin, pageHeight - 7);
        pdf.text(`Mindful Map Analytics  Page 1/1`, pageWidth - margin - 40, pageHeight - 7);
        
        pdf.save(`${title}.pdf`);
      }).catch(error => {
        console.error('Error loading images:', error);
      });
    });
  };
  
  const generateSummaryText = (chartId) => {
    switch (chartId) {
      case 'monthly-users-chart':
        const totalMonthlyUsers = monthlyUsers;
        const highestMonth = monthlyUserData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).month || 'N/A';
        const averageMonthlyUsers = monthlyUserData.length > 0 ? 
          (monthlyUserData.reduce((sum, data) => sum + data.count, 0) / monthlyUserData.length).toFixed(2) : 0;
        return `The total number of registered users across all months is ${totalMonthlyUsers}. The highest number of registrations occurred in ${highestMonth}. The average number of users registered per month is ${averageMonthlyUsers}. This data helps track user growth trends over time and identify seasonal patterns in user registration.`;
      
      case 'active-vs-inactive-users-chart':
        const active = activeVsInactiveUsersData.active || 0;
        const inactive = activeVsInactiveUsersData.inactive || 0;
        const total = active + inactive;
        const activePercentage = total > 0 ? ((active / total) * 100).toFixed(2) : 0;
        return `Currently, there are ${active} active users and ${inactive} inactive users on the platform. Active users represent ${activePercentage}% of the total user base. This ratio is important for understanding user retention and engagement levels across the platform.`;
      
      case 'daily-mood-logs-chart':
        const totalMoodLogs = dailyMoodLogsData.reduce((sum, data) => sum + data.count, 0);
        const avgMoodLogs = dailyMoodLogsData.length > 0 ?
          (totalMoodLogs / dailyMoodLogsData.length).toFixed(2) : 0;
        const highestMoodLogDay = dailyMoodLogsData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).date || 'N/A';
        return `Users have recorded a total of ${totalMoodLogs} mood entries across the displayed period. The average is ${avgMoodLogs} mood logs per day, with the highest activity on ${highestMoodLogDay}. This data shows how frequently users are tracking their emotional states.`;
      
      case 'daily-journal-logs-chart':
        const totalJournalLogs = dailyJournalLogsData.reduce((sum, data) => sum + data.count, 0);
        const avgJournalLogs = dailyJournalLogsData.length > 0 ?
          (totalJournalLogs / dailyJournalLogsData.length).toFixed(2) : 0;
        const highestJournalLogDay = dailyJournalLogsData.reduce((max, data) => data.count > max.count ? data : max, { count: 0 }).date || 'N/A';
        return `Users have created a total of ${totalJournalLogs} journal entries during this period. Daily journaling averages ${avgJournalLogs} entries per day, with peak activity occurring on ${highestJournalLogDay}. Journal logs represent deeper user engagement with the reflection process.`;
      
      case 'weekly-correlation-values-chart':
        const avgCorrelationValue = weeklyCorrelationValuesData.length > 0 ?
          (weeklyCorrelationValuesData.reduce((sum, data) => sum + data.count, 0) / weeklyCorrelationValuesData.length).toFixed(2) : 0;
        const correlationTrend = getWeeklyTrend(weeklyCorrelationValuesData);
        return `The average correlation value across all weeks is ${avgCorrelationValue}, with a ${correlationTrend} trend. Correlation values measure the strength of relationship between user activities and mood states. Higher values indicate stronger connections between activities and emotional outcomes.`;
      
      default:
        return "This chart summarizes the data collected within the Mindful Map application. Please refer to the visual representation above for specific data points and trends.";
    }
  };
  
  const getWeeklyTrend = (data) => {
    if (data.length < 2) return "stable";
    const firstValues = data.slice(0, Math.ceil(data.length/2));
    const secondValues = data.slice(-Math.ceil(data.length/2));
    const firstAvg = firstValues.reduce((sum, item) => sum + item.count, 0) / firstValues.length;
    const secondAvg = secondValues.reduce((sum, item) => sum + item.count, 0) / secondValues.length;
    const difference = secondAvg - firstAvg;
    if (difference > 0.1) return "increasing";
    if (difference < -0.1) return "decreasing";
    return "stable";
  };
  
  return (
    <div className="flex min-h-screen bg-[#F8FAF9]">
      <div className="w-1/5">
        <Navbar />
      </div>

      <div className="flex-grow p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36 w-72">
            <ShowChartIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Total Users</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{monthlyUsers}</p>
            </div>
          </div>
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36 w-72">
            <TaskAltIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Active Users</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{activeUsersCount}</p>
            </div>
          </div>
          <div className="bg-[#F8FAF9] border border-[#6fba94] rounded-lg p-4 flex items-center h-36 w-72">
            <BlockIcon className="text-[#64aa86] mr-4" style={{ fontSize: '48px' }} />
            <div>
              <h2 className="text-[#292f33] font-bold text-xl">Inactive Users</h2>
              <p className="text-[#64aa86] font-bold text-2xl">{inactiveUsersCount}</p>
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
                onClick={() => generatePDF('monthly-users-chart', 'Monthly Users')}
              />
            </div>
            <div className="h-64">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="grid grid-cols-1 gap-4 w-full max-w-6xl">
            <div id="active-vs-inactive-users-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6">
              <h2 className="text-[#292f33] font-bold text-xl mb-4">Active and Inactive Users</h2>
              <div className="absolute top-2 right-2">
                <DownloadIcon
                  className="text-[#64aa86] cursor-pointer"
                  style={{ fontSize: '20px' }}
                  onClick={() => generatePDF('active-vs-inactive-users-chart', 'Active vs Inactive Users')}
                />
              </div>
              <div className="h-64">
                <Pie data={activeVsInactiveUsersChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>
          <div id="daily-mood-logs-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 w-full max-w-6xl mt-6">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Daily Mood Logs</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => generatePDF('daily-mood-logs-chart', 'Daily Mood Logs')}
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
                onClick={() => generatePDF('daily-journal-logs-chart', 'Daily Journal Logs')}
              />
            </div>
            <div className="h-64">
              <Line data={dailyJournalLogsChartData} options={lineChartOptions} />
            </div>
          </div>
          <div id="weekly-correlation-values-chart" className="relative bg-transparent border border-[#6fba94] rounded-lg p-6 w-full max-w-6xl mt-6">
            <h2 className="text-[#292f33] font-bold text-xl mb-4">Weekly Correlation Values</h2>
            <div className="absolute top-2 right-2">
              <DownloadIcon
                className="text-[#64aa86] cursor-pointer"
                style={{ fontSize: '20px' }}
                onClick={() => generatePDF('weekly-correlation-values-chart', 'Weekly Correlation Values')}
              />
            </div>
            <div className="h-64">
              <Line data={weeklyCorrelationValuesChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
