import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import BottomNav from '../BottomNav';

// Material UI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip
} from '@mui/material';

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoodIcon from '@mui/icons-material/Mood';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const Profile = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('profile');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    section: '',
    avatar: '',
    password: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    consecutiveDays: 0,
    totalMoodLogs: 0,
    weeklyMostFrequentMood: null,
    overallMostFrequentMood: null,
    loading: true
  });

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Dialog states
  const [passwordDialog, setPasswordDialog] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchProfileStats();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const user = response.data;
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        section: user.section || '',
        avatar: user.avatar || '',
        password: ''
      });
      setAvatarPreview(user.avatar || '');
      setFormData({
        email: user.email || '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const fetchProfileStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/auth/profile-stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setStats({
        ...response.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
      toast.error('Failed to load profile statistics');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return profileData.avatar;

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      const formDataForUpload = new FormData();
      formDataForUpload.append('avatar', avatarFile);

      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/auth/upload-avatar`, formDataForUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return profileData.avatar;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Upload avatar first if there's a new one
      let avatarUrl = profileData.avatar;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Prepare update data
      const updateData = {
        email: formData.email,
        avatar: avatarUrl
      };

      // Only include password if it's being changed
      if (formData.password && formData.password.trim() !== '') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await axios.put(`${import.meta.env.VITE_NODE_API}/api/auth/update-profile`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      fetchProfileData(); // Refresh data
      setAvatarFile(null);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(profileData.avatar);
    setFormData({
      email: profileData.email,
      password: '',
      confirmPassword: ''
    });
  };

  const formatMoodText = (mood) => {
    if (!mood) return 'No data';
    const { emotion, count, percentage } = mood;
    return `${emotion} (${count} times, ${percentage?.toFixed(1)}%)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] to-[#E8F5E8] pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <Container maxWidth="lg">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <IconButton onClick={() => navigate(-1)} className="text-[#6fba94]">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" className="font-bold text-[#4a8063]">
                My Profile
              </Typography>
            </div>
            <div className="flex items-center space-x-2">
              <PersonIcon className="text-[#6fba94]" />
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="lg" className="py-6">
        <Grid container spacing={3}>
          
          {/* Profile Information Card */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        color: '#1f2937',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Profile Information
                    </Typography>
                    <IconButton 
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={loading}
                      sx={{
                        color: '#6fba94',
                        backgroundColor: 'rgba(111, 186, 148, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(111, 186, 148, 0.2)',
                        },
                        borderRadius: '12px',
                        padding: '8px'
                      }}
                    >
                      {isEditing ? <CancelIcon /> : <EditIcon />}
                    </IconButton>
                  </div>

                  <div className="flex flex-col items-center mb-6">
                    {/* Avatar Section */}
                    <div className="relative mb-4">
                      <Avatar
                        src={avatarPreview}
                        sx={{ 
                          width: 100, 
                          height: 100,
                          border: '3px solid #6fba94'
                        }}
                      >
                        {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                      </Avatar>
                      {isEditing && (
                        <IconButton
                          component="label"
                          className="absolute -bottom-2 -right-2 bg-[#6fba94] text-white hover:bg-[#5aa88f]"
                          size="small"
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <PhotoCameraIcon fontSize="small" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                        </IconButton>
                      )}
                    </div>

                    <Typography 
                      variant="h5" 
                      className="font-bold text-center text-black"
                      sx={{ 
                        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                        mb: 1
                      }}
                    >
                      {profileData.firstName} {profileData.lastName}
                    </Typography>
                    
                    {/* Email display under name */}
                    <Typography 
                      variant="body1" 
                      className="text-center text-gray-600"
                      sx={{ 
                        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        color: '#6b7280',
                        mb: 1
                      }}
                    >
                      {profileData.email || 'No email set'}
                    </Typography>
                    
                    {/* Section display */}
                    {profileData.section && (
                      <Typography 
                        variant="body2" 
                        className="text-center"
                        sx={{ 
                          fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: '#6fba94',
                          backgroundColor: 'rgba(111, 186, 148, 0.1)',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          border: '1px solid rgba(111, 186, 148, 0.2)'
                        }}
                      >
                        {profileData.section}
                      </Typography>
                    )}
                  </div>

                  <div className="space-y-4 mt-6">
                    {/* Email Field (only show when editing) */}
                    {isEditing && (
                      <div className="flex items-center space-x-3">
                        <EmailIcon className="text-[#6fba94]" />
                        <TextField
                          fullWidth
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="Enter email"
                        />
                      </div>
                    )}

                    {/* Password Fields (only show when editing) */}
                    {isEditing && (
                      <>
                        <div className="flex items-center space-x-3">
                          <LockIcon className="text-[#6fba94]" />
                          <TextField
                            fullWidth
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            placeholder="New password (leave blank to keep current)"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <LockIcon className="text-[#6fba94]" />
                          <TextField
                            fullWidth
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex space-x-2 mt-6">
                      <Button
                        variant="contained"
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                        className="bg-[#6fba94] hover:bg-[#5aa88f]"
                        fullWidth
                      >
                        {loading ? 'Updating...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={loading}
                        startIcon={<CancelIcon />}
                        className="border-[#6fba94] text-[#6fba94]"
                        fullWidth
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Account Statistics Card */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      color: '#1f2937',
                      letterSpacing: '-0.01em',
                      mb: 3
                    }}
                  >
                    Account Statistics
                  </Typography>

                  {stats.loading ? (
                    <div className="flex justify-center py-8">
                      <CircularProgress className="text-[#6fba94]" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Consecutive Days */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#6fba94]/10 to-[#5aa88f]/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CalendarTodayIcon className="text-[#6fba94]" />
                          <div>
                            <Typography variant="body2" className="text-gray-600">
                              Consecutive Days Logging
                            </Typography>
                            <Typography variant="h4" className="font-bold text-[#4a8063]">
                              {stats.consecutiveDays}
                            </Typography>
                          </div>
                        </div>
                        <Chip 
                          label="Days"
                          className="bg-[#6fba94] text-white"
                        />
                      </div>

                      {/* Total Mood Logs */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#6fba94]/10 to-[#5aa88f]/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <BarChartIcon className="text-[#6fba94]" />
                          <div>
                            <Typography variant="body2" className="text-gray-600">
                              Total Mood Logs
                            </Typography>
                            <Typography variant="h4" className="font-bold text-[#4a8063]">
                              {stats.totalMoodLogs}
                            </Typography>
                          </div>
                        </div>
                        <Chip 
                          label="Entries"
                          className="bg-[#6fba94] text-white"
                        />
                      </div>

                      <Divider />

                      {/* Most Frequent Moods */}
                      <div className="space-y-4">
                        <Typography variant="subtitle1" className="font-semibold text-[#4a8063]">
                          Most Frequent Moods
                        </Typography>

                        {/* Weekly */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUpIcon className="text-blue-600" fontSize="small" />
                            <Typography variant="body2" className="font-medium text-blue-800">
                              This Week
                            </Typography>
                          </div>
                          <Typography variant="body2" className="text-gray-700">
                            {formatMoodText(stats.weeklyMostFrequentMood)}
                          </Typography>
                        </div>

                        {/* Overall */}
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <MoodIcon className="text-purple-600" fontSize="small" />
                            <Typography variant="body2" className="font-medium text-purple-800">
                              Overall
                            </Typography>
                          </div>
                          <Typography variant="body2" className="text-gray-700">
                            {formatMoodText(stats.overallMostFrequentMood)}
                          </Typography>
                        </div>
                      </div>

                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

        </Grid>
      </Container>

      {/* Bottom Navigation */}
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default Profile;