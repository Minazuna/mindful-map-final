import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import BottomNav from '../../BottomNav';

import Anova from './StatisticsComponents/Anova';
import DetailedMoodAnalysis from './StatisticsComponents/DetailedMoodAnalysis';
import MoodAnalysis from './StatisticsComponents/MoodAnalysis';
import SleepAnalysis from './StatisticsComponents/SleepAnalysis';

const Statistics = () => {
  const [navValue, setNavValue] = useState('statistics');
  const [moodLogs, setMoodLogs] = useState([]);
  const [moodType, setMoodType] = useState('after');
  const [moodPeriod, setMoodPeriod] = useState('monthly');
  const [sleepHoursData, setSleepHoursData] = useState([]);
  const [sleepAnalytics, setSleepAnalytics] = useState(null);
  const [sleepPeriod, setSleepPeriod] = useState('weekly');
  const moodChartRef = useRef(null);
  const sleepChartRef = useRef(null);

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMoodLogs(response.data);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      }
    };
    fetchMoodData();
  }, []);

  useEffect(() => {
    const fetchSleepHoursData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/statistics/sleep-hours?period=${sleepPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSleepHoursData(response.data.sleepHoursData);
        setSleepAnalytics(response.data.analytics);
      } catch (error) {
        console.error('Error fetching sleep hours data:', error);
        setSleepHoursData([]);
        setSleepAnalytics(null);
      }
    };
    fetchSleepHoursData();
  }, [sleepPeriod]);

  // iOS Switch for MoodAnalysis
  // If you have a custom IOSSwitch component, import and pass it here
  // import IOSSwitch from './IOSSwitch';

  return (
    <div className="min-h-screen pb-20 bg-[#55AD9B]">
      <div className="max-w-4xl mx-auto pt-6 px-4">
        <Anova />
        <DetailedMoodAnalysis />
        <MoodAnalysis
          moodLogs={moodLogs}
          moodType={moodType}
          moodPeriod={moodPeriod}
          setMoodType={setMoodType}
          setMoodPeriod={setMoodPeriod}
          moodChartRef={moodChartRef}
          handleMoodClick={
            (emotion) => {
              // If you want to keep mood details navigation, you can still use useNavigate here
              const navigate = useNavigate();
              navigate('/mood-statistics', {
                state: { emotion: emotion.toLowerCase(), moodType, period: moodPeriod }
              });
            }
          }
        />
        <SleepAnalysis
          sleepHoursData={sleepHoursData}
          sleepAnalytics={sleepAnalytics}
          sleepPeriod={sleepPeriod}
          setSleepPeriod={setSleepPeriod}
          sleepChartRef={sleepChartRef}
        />
      </div>
      <BottomNav value={navValue} setValue={setNavValue} />
    </div>
  );
};

export default Statistics;