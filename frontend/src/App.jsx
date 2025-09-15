import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AboutUs from './components/AboutUs';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Home from './components/User/Home';
import MoodEntries from './components/User/MoodEntries';
import CalendarLog from './components/User/CalendarLog';
import DailyRecommendations from './components/User/DailyRecommendations';
import JournalLogs from './components/User/Journal/JournalLogs';
import JournalEntry from './components/User/Journal/JournalEntry';
import ViewJournal from './components/User/Journal/ViewJournal';
import EditJournal from './components/User/Journal/EditJournal';
import JournalPrompt from './components/User/Journal/JournalPrompt';
import Statistics from './components/User/Statistics/Statistics';
import CorrelationStatistics from './components/User/Statistics/CorrelationStatistics';
import Correlation from './components/User/Statistics/Correlation';
import MoodStatistics from './components/User/Statistics/MoodStatistics';
import WeeklyPredictions from './components/User/Prediction/WeeklyPredictions';
import DailyPrediction from './components/User/Prediction/DailyPrediction';
import Prediction from './components/User/Prediction/Prediction';
import CategoryPrediction from './components/User/Prediction/CategoryPrediction';
import Recommendations from './components/User/Statistics/Recommendations';
import Pomodoro from './components/User/Activities/Pomodoro';
import Affirmation from './components/User/Activities/Affirmation';
import ListTask from './components/User/Activities/ListTask';
import CalmingMusic from './components/User/Activities/CalmingMusic';
import Activities from './components/User/Activities';
import Meditation from './components/User/Activities/Meditation';
import ForumDiscussion from './components/User/Forum';
import PersonalJournal from './components/User/Journal/PersonalJournal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import Dashboard from './components/Admin/Dashboard';
import UsersTable from './components/Admin/UsersTable';
import InactiveUsers from './components/Admin/InactiveUsers';
import PromptsTable from './components/Admin/PromptsTable';
import StatisticsTable from './components/Admin/StatisticsTable';

//Student's Inputs 
import ChooseCategory from './components/User/Inputs/ChooseCategory';
import TimeSegmentSelector from './components/User/Inputs/TimeSegmentSelector';
import BeforeValence from './components/User/Inputs/BeforeValence';
import AfterValence from './components/User/Inputs/AfterValence';
import BeforePositive from './components/User/Inputs/BeforePositive';
import BeforeNegative from './components/User/Inputs/BeforeNegative';
import AfterPositive from './components/User/Inputs/AfterPositive';
import AfterNegative from './components/User/Inputs/AfterNegative';

import OverallActivities from './components/User/Inputs/OverallActivities';
import Health from './components/User/Inputs/Health';
import Social from './components/User/Inputs/Social';
import Sleep from './components/User/Inputs/Sleep';

//Breathing Exercise
import BreathingExercise from './components/User/Activities/BreathingExercise/BreathingExercise';
import CompletionModal from './components/User/Activities/BreathingExercise/CompletionModal';
import ProgressModal from './components/User/Activities/BreathingExercise/ProgressModal';

//Statistics
import DailyStatistics from './components/User/Statistics/Daily/DailyStatistics';
import WeeklyStatistics from './components/User/Statistics/Weekly/WeeklyStatistics';
import DailyAnova from './components/User/Statistics/Daily/DailyAnova';

const useAuth = () => {
  const token = localStorage.getItem('token');
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (token) {
        try {
          const userResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUserRole(userResponse.data.role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [token]);

  return { token, userRole, loading };
};

const UserPrivateRoute = ({ children }) => {
  const { token, userRole, loading } = useAuth();
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevLocation) {
      setPrevLocation(location.pathname);
    }
  }, [location.pathname, prevLocation]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    toast.error('Please sign in to access this page.');
    return <Navigate to="/signin" />;
  }

  if (userRole !== 'user') {
    toast.error('Access denied.');
    return <Navigate to={prevLocation} replace />;
  }

  return children;
};

const AdminPrivateRoute = ({ children }) => {
  const { token, userRole, loading } = useAuth();
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevLocation) {
      setPrevLocation(location.pathname);
    }
  }, [location.pathname, prevLocation]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    toast.error('Please sign in to access this page.');
    return <Navigate to="/signin" />;
  }

  if (userRole !== 'admin') {
    toast.error('Access denied.');
    return <Navigate to={prevLocation} replace />;
  }

  return children;
};

const App = () => {
  const [formData, setFormData] = useState({
    mood: '',
    activities: [],
    social: [],
    health: [],
    sleepQuality: '',
  });

  // New category-based form data
  const [categoryFormData, setCategoryFormData] = useState({
    category: '',
    activity: '',
    hrs: 0,
    beforeValence: '',
    beforeEmotion: null,
    beforeIntensity: 0,
    beforeReason: null,
    afterValence: '',
    afterEmotion: '',
    afterIntensity: 0,
    afterReason: '',
    selectedDate: null,
    selectedTime: null
  });

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route
          path="/choose-category"
          element={
            <UserPrivateRoute>
              <ChooseCategory categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/time-segment"
          element={
            <UserPrivateRoute>
              <TimeSegmentSelector categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/before-valence"
          element={
            <UserPrivateRoute>
              <BeforeValence categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/after-valence"
          element={
            <UserPrivateRoute>
              <AfterValence categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/before-positive"
          element={
            <UserPrivateRoute>
              <BeforePositive categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/before-negative"
          element={
            <UserPrivateRoute>
              <BeforeNegative categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/after-positive"
          element={
            <UserPrivateRoute>
              <AfterPositive categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/after-negative"
          element={
            <UserPrivateRoute>
              <AfterNegative categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/overall-activities"
          element={
            <UserPrivateRoute>
              <OverallActivities categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/social-interactions"
          element={
            <UserPrivateRoute>
              <Social categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/health-activities"
          element={
            <UserPrivateRoute>
              <Health categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/sleep-hours"
          element={
            <UserPrivateRoute>
              <Sleep categoryFormData={categoryFormData} setCategoryFormData={setCategoryFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/mood-entries"
          element={
            <UserPrivateRoute>
              <MoodEntries />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/daily-statistics"
          element={
            <UserPrivateRoute>
              <DailyStatistics />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/weekly-statistics"
          element={
            <UserPrivateRoute>
              <WeeklyStatistics />
            </UserPrivateRoute>
          }
        />
       <Route
          path="/daily-anova"
          element={
            <UserPrivateRoute>
              <DailyAnova />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/calendar-log"
          element={
            <UserPrivateRoute>
              <CalendarLog formData={formData} setFormData={setFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/daily-recommendations"
          element={
            <UserPrivateRoute>
              <DailyRecommendations />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/journal-logs"
          element={
            <UserPrivateRoute>
              <JournalLogs />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/journal-entry"
          element={
            <UserPrivateRoute>
              <JournalEntry />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/view-journal/:id"
          element={
            <UserPrivateRoute>
              <ViewJournal />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/edit-journal/:id"
          element={
            <UserPrivateRoute>
              <EditJournal />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/journal-prompt"
          element={
            <UserPrivateRoute>
              <JournalPrompt />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <UserPrivateRoute>
              <Statistics />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/correlation"
          element={
            <UserPrivateRoute>
              <Correlation />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/correlation-statistics"
          element={
            <UserPrivateRoute>
              <CorrelationStatistics />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/mood-statistics/:mood"
          element={
            <UserPrivateRoute>
              <MoodStatistics />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/prediction"
          element={
            <UserPrivateRoute>
              <Prediction formData={formData} setFormData={setFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/weekly-predictions"
          element={
            <UserPrivateRoute>
              <WeeklyPredictions formData={formData} setFormData={setFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/daily-prediction"
          element={
            <UserPrivateRoute>
              <DailyPrediction formData={formData} setFormData={setFormData} />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/category-prediction/:category"
          element={
            <UserPrivateRoute>
              <CategoryPrediction />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <UserPrivateRoute>
              <Recommendations />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/breathing-exercise"
          element={
            <UserPrivateRoute>
              <BreathingExercise />
            </UserPrivateRoute>
          }
        />
         <Route
          path="/pomodoro"
          element={
            <UserPrivateRoute>
              <Pomodoro />
            </UserPrivateRoute>
          }
        />
         <Route
          path="/list-task"
          element={
            <UserPrivateRoute>
              <ListTask />
            </UserPrivateRoute>
          }
        />
         <Route
          path="/affirmation"
          element={
            <UserPrivateRoute>
              <Affirmation />
            </UserPrivateRoute>
          }
        />
         <Route
          path="/calming-music"
          element={
            <UserPrivateRoute>
              <CalmingMusic />
            </UserPrivateRoute>
          }
        />
         <Route
          path="/meditation"
          element={
            <UserPrivateRoute>
              <Meditation />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <UserPrivateRoute>
              <Activities />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/forum"
          element={
            <UserPrivateRoute>
              <ForumDiscussion />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/personal-journal"
          element={
            <UserPrivateRoute>
              <PersonalJournal />
            </UserPrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminPrivateRoute>
              <Dashboard />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminPrivateRoute>
              <UsersTable />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/inactive"
          element={
            <AdminPrivateRoute>
              <InactiveUsers />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/prompts"
          element={
            <AdminPrivateRoute>
              <PromptsTable />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/statistics"
          element={
            <AdminPrivateRoute>
              <StatisticsTable />
            </AdminPrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;