import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const PredictionComparison = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [dailyComparisonData, setDailyComparisonData] = useState(null);
  const [weekInfo, setWeekInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [availableWeeks, setAvailableWeeks] = useState([]);

  const categories = [
    { key: 'activity', name: 'Activity', color: '#3B82F6' },
    { key: 'social', name: 'Social', color: '#10B981' },
    { key: 'health', name: 'Health', color: '#F59E0B' },
    { key: 'sleep', name: 'Sleep', color: '#8B5CF6' }
  ];

  const moodColors = {
    'Bored': '#94A3B8',
    'Sad': '#64748B',
    'Disappointed': '#475569',
    'Angry': '#EF4444',
    'Tense': '#DC2626',
    'Calm': '#06B6D4',
    'Relaxed': '#0EA5E9',
    'Pleased': '#22C55E',
    'Happy': '#84CC16',
    'Excited': '#EAB308',
    'No data': '#E5E7EB'
  };

  useEffect(() => {
    fetchAvailableWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetchComparisonData();
      fetchDailyComparisonData();
    }
  }, [selectedWeek, selectedDay]);

  const fetchAvailableWeeks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/available-weeks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const weeks = result.availableWeeks || [];
        setAvailableWeeks(weeks);
        
        // Auto-select the first (most recent) week
        if (weeks.length > 0 && !selectedWeek) {
          setSelectedWeek(weeks[0].weekStartDate);
        }
      }
    } catch (err) {
      console.error('Error fetching available weeks:', err);
      setAvailableWeeks([]);
    }
  };

  const fetchDailyComparisonData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!selectedWeek) {
        return;
      }
      
      const url = `${import.meta.env.VITE_NODE_API}/api/admin/daily-mood-comparison?weekStartDate=${encodeURIComponent(selectedWeek)}${selectedDay ? `&selectedDay=${selectedDay}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDailyComparisonData(result.data);
      } else {
        console.error('Failed to fetch daily comparison data');
      }
    } catch (err) {
      console.error('Error fetching daily comparison data:', err);
    }
  };

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!selectedWeek) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/prediction-comparisons?weekStartDate=${encodeURIComponent(selectedWeek)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch comparison data: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      setComparisonData(result.data);
      setWeekInfo(result.weekInfo);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePredictions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/calculate-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Calculate predictions error:', errorText);
        throw new Error(`Failed to calculate predictions: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchComparisonData(); // Refresh data after calculation
    } catch (err) {
      console.error('Calculate predictions error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateActualMoods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/update-actual-moods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update actual moods error:', errorText);
        throw new Error(`Failed to update actual moods: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchComparisonData(); // Refresh data after update
    } catch (err) {
      console.error('Update actual moods error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createCategoryComparisonChart = (categoryKey, categoryData, categoryName) => {
    if (!categoryData) return null;

    const chartData = {
      labels: ['Top 1 Matches', 'Top 2 Matches', 'Top 3 Matches', 'Missed'],
      datasets: [
        {
          label: `${categoryName} - ${selectedDay}`,
          data: [
            categoryData.top1Matches,
            categoryData.top2Matches,
            categoryData.top3Matches,
            categoryData.missedPredictions
          ],
          backgroundColor: [
            '#10B981', // Green for Top 1
            '#F59E0B', // Yellow for Top 2
            '#3B82F6', // Blue for Top 3
            '#EF4444'  // Red for Missed
          ],
          borderColor: [
            '#059669',
            '#D97706',
            '#2563EB',
            '#DC2626'
          ],
          borderWidth: 1,
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `${categoryName} - ${selectedDay}`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const total = categoryData.totalPredictions;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} users (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Match Type'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Users'
          }
        }
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  const renderStatisticsCards = () => {
    if (!dailyComparisonData || !dailyComparisonData.dailyComparison || !dailyComparisonData.dailyComparison[selectedDay]) {
      return <div className="text-gray-500 text-center">No data available for {selectedDay}</div>;
    }

    const dayData = dailyComparisonData.dailyComparison[selectedDay];
    
    // Calculate totals across all categories
    let totalTop1 = 0, totalTop2 = 0, totalTop3 = 0, totalMissed = 0, totalPredictions = 0;
    
    Object.values(dayData.categories || {}).forEach(categoryData => {
      totalTop1 += categoryData.top1Matches || 0;
      totalTop2 += categoryData.top2Matches || 0;
      totalTop3 += categoryData.top3Matches || 0;
      totalMissed += categoryData.missedPredictions || 0;
      totalPredictions += categoryData.totalPredictions || 0;
    });

    const statistics = [
      {
        title: 'Top 1 Matches',
        value: totalTop1,
        percentage: totalPredictions > 0 ? ((totalTop1 / totalPredictions) * 100).toFixed(1) : 0,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      },
      {
        title: 'Top 2 Matches',
        value: totalTop2,
        percentage: totalPredictions > 0 ? ((totalTop2 / totalPredictions) * 100).toFixed(1) : 0,
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      },
      {
        title: 'Top 3 Matches',
        value: totalTop3,
        percentage: totalPredictions > 0 ? ((totalTop3 / totalPredictions) * 100).toFixed(1) : 0,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      {
        title: 'Missed Predictions',
        value: totalMissed,
        percentage: totalPredictions > 0 ? ((totalMissed / totalPredictions) * 100).toFixed(1) : 0,
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statistics.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 text-center`}>
            <h3 className={`${stat.textColor} font-semibold text-lg mb-2`}>{stat.title}</h3>
            <p className={`${stat.textColor} text-3xl font-bold mb-1`}>{stat.value}</p>
            <p className={`${stat.textColor} text-sm opacity-75`}>{stat.percentage}%</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mood Prediction Comparison
              </h1>
              {weekInfo && (
                <p className="text-gray-600 mt-2">
                  Week: {weekInfo.weekNumber}, {weekInfo.year} | 
                  Total Users: {weekInfo.totalUsers}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={calculatePredictions}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Calculate Predictions
              </button>
              <button
                onClick={updateActualMoods}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                Update Actual Moods
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 font-medium">Select Week:</label>
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={availableWeeks.length === 0}
            >
              {availableWeeks.length === 0 && (
                <option value="">No weeks available</option>
              )}
              {availableWeeks.map((week) => {
                const weekStart = new Date(week.weekStartDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                const today = new Date();
                const isCurrentWeek = today >= weekStart && today <= weekEnd;
                
                return (
                  <option key={week.weekStartDate} value={week.weekStartDate}>
                    {week.displayName} {isCurrentWeek ? '(Current week)' : ''}
                  </option>
                );
              })}
            </select>
            
            <label className="text-gray-700 font-medium ml-4">Show predictions for selected week</label>
            
            {availableWeeks.length > 0 && (
              <p className="text-sm text-gray-500">
                Available weeks: {availableWeeks.length}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">
              Make sure the backend server is running on http://localhost:5000 and that you have calculated predictions first.
            </p>
          </div>
        )}

        {!comparisonData && !loading && !error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">No Data Available</p>
            <p>No prediction data found for the selected week. Please click "Calculate Predictions" to generate prediction data first.</p>
          </div>
        )}

        {dailyComparisonData && (
          <div className="space-y-8">
            {/* Day Selection Buttons */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-4 text-gray-700">
                Select Day of the Week:
              </label>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedDay === day
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics Cards for selected day */}
            {dailyComparisonData && dailyComparisonData.dailyComparison && dailyComparisonData.dailyComparison[selectedDay] && renderStatisticsCards()}
            
            {/* Category Comparison Charts */}
            {dailyComparisonData && dailyComparisonData.dailyComparison && dailyComparisonData.dailyComparison[selectedDay] && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 text-center">
                  {selectedDay} - Category-wise Mood Prediction Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {categories.map(category => (
                    <div key={category.key} className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="h-96">
                        {createCategoryComparisonChart(
                          category.key, 
                          dailyComparisonData.dailyComparison[selectedDay].categories[category.key],
                          category.name
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {comparisonData && (
          <div className="space-y-8">
            {/* Charts removed */}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionComparison;