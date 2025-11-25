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
    password: '',
    provider: 'email'
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

  // Validation state
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarPublicId, setAvatarPublicId] = useState('');
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
        password: '',
        provider: user.provider || 'email'
      });
      setAvatarPreview(user.avatar || '');
      setAvatarPublicId(user.avatarPublicId || '');
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


  // Email validation helper
  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    // Simple email regex
    const re = /^\S+@\S+\.\S+$/;
    if (!re.test(email)) return 'Invalid email address';
    return '';
  };

  // Password validation helper
  const validatePassword = (password) => {
    if (password && password.length > 0 && password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Confirm password validation helper
  const validateConfirmPassword = (password, confirmPassword) => {
    if (password && confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // Real-time validation on input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: value,
      ...(name === 'password' && value === '' && { confirmPassword: '' })
    };
    setFormData(newFormData);

    // Validate fields
    let errors = { ...formErrors };
    if (name === 'email') {
      errors.email = validateEmail(value);
    }
    if (name === 'password') {
      errors.password = validatePassword(value);
      errors.confirmPassword = validateConfirmPassword(value, newFormData.confirmPassword);
    }
    if (name === 'confirmPassword') {
      errors.confirmPassword = validateConfirmPassword(newFormData.password, value);
    }
    setFormErrors(errors);
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
    if (!avatarFile) return { url: profileData.avatar, publicId: avatarPublicId };

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

      return { 
        url: response.data.avatarUrl,
        publicId: response.data.publicId || ''
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return { url: profileData.avatar, publicId: avatarPublicId };
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Validate all fields before saving
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    setFormErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });

    // If any errors exist, prevent save
    if (emailError || passwordError || confirmPasswordError) {
      toast.error('Please fix the errors in the form before saving.');
      return;
    }

    setLoading(true);
    try {
      // Prevent Google users from updating
      if (profileData.provider === 'Google') {
        toast.error('Google accounts cannot be edited');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      // Upload avatar first if there's a new one
      let avatarUrl = profileData.avatar;
      let newAvatarPublicId = avatarPublicId;
      if (avatarFile) {
        const uploadResult = await uploadAvatar();
        avatarUrl = uploadResult.url;
        newAvatarPublicId = uploadResult.publicId;
      }

      // Prepare update data
      const updateData = {
        email: formData.email,
        avatar: avatarUrl,
        avatarPublicId: newAvatarPublicId
      };

      // Only include password if it's being changed
      if (formData.password && formData.password.trim() !== '') {
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
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(profileData.avatar);
    setAvatarPublicId(profileData.avatarPublicId || '');
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
                      disabled={loading || profileData.provider === 'Google'}
                      title={profileData.provider === 'Google' ? 'Google accounts cannot be edited' : ''}
                      sx={{
                        color: profileData.provider === 'Google' ? '#9ca3af' : '#6fba94',
                        backgroundColor: profileData.provider === 'Google' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(111, 186, 148, 0.1)',
                        '&:hover': {
                          backgroundColor: profileData.provider === 'Google' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(111, 186, 148, 0.2)',
                        },
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: profileData.provider === 'Google' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isEditing ? <CancelIcon /> : <EditIcon />}
                    </IconButton>
                  </div>

                  <div className="flex flex-col items-center mb-6">
                    {/* Avatar Section */}
                    <Avatar
                      src={profileData.avatar}
                      sx={{ 
                        width: 100, 
                        height: 100,
                        border: '3px solid #6fba94',
                        mb: 2
                      }}
                    >
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </Avatar>

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
                    {/* Google Account Warning */}
                    {profileData.provider === 'Google' && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <Typography variant="body2" className="text-amber-800">
                          <strong>Note:</strong> Your account is linked to Google. Email and password cannot be modified. To change your avatar, please contact support.
                        </Typography>
                      </div>
                    )}
                  </div>
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

      {/* Edit Profile Modal Dialog */}
      <Dialog 
        open={isEditing} 
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: '#fff'
          }
        }}
      >
        <DialogTitle 
          sx={{
            fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#1f2937',
            borderBottom: '1px solid #e5e7eb',
            pb: 2
          }}
        >
          Edit Profile
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <div className="space-y-6">
            {/* Avatar Preview Section */}
            <div className="flex flex-col items-center">
              <Typography 
                variant="subtitle2" 
                sx={{
                  fontWeight: 600,
                  color: '#4a8063',
                  mb: 2
                }}
              >
                Profile Photo
              </Typography>
              
              <Avatar
                src={avatarPreview}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: '3px solid #6fba94',
                  boxShadow: '0 4px 12px rgba(111, 186, 148, 0.2)',
                  mb: 3
                }}
              >
                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
              </Avatar>

              {profileData.provider !== 'Google' && (
                <Box
                  component="label"
                  sx={{
                    width: '100%',
                    p: 2.5,
                    border: '2px dashed #6fba94',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(111, 186, 148, 0.05)',
                    cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    '&:hover': {
                      backgroundColor: 'rgba(111, 186, 148, 0.1)',
                      borderColor: '#5aa88f'
                    },
                    '&:active': {
                      backgroundColor: 'rgba(111, 186, 148, 0.15)'
                    }
                  }}
                >
                  {uploadingAvatar ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress size={24} sx={{ color: '#6fba94' }} />
                    </div>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6fba94',
                        fontWeight: 500,
                        pointerEvents: 'none'
                      }}
                    >
                      Click to select new photo
                    </Typography>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    disabled={uploadingAvatar}
                  />
                </Box>
              )}
            </div>

            <Divider />

            {profileData.provider !== 'Google' ? (
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <Typography 
                    variant="subtitle2" 
                    sx={{
                      fontWeight: 600,
                      color: '#4a8063',
                      mb: 1
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    placeholder="Enter email"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover fieldset': {
                          borderColor: '#6fba94'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6fba94'
                        }
                      }
                    }}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <Typography 
                    variant="subtitle2" 
                    sx={{
                      fontWeight: 600,
                      color: '#4a8063',
                      mb: 1
                    }}
                  >
                    New Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    placeholder="Leave blank to keep current"
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover fieldset': {
                          borderColor: '#6fba94'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6fba94'
                        }
                      }
                    }}
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <Typography 
                    variant="subtitle2" 
                    sx={{
                      fontWeight: 600,
                      color: '#4a8063',
                      mb: 1
                    }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={!formData.password || formData.password.trim() === ''}
                    variant="outlined"
                    size="small"
                    placeholder="Confirm new password"
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword || (!formData.password )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover fieldset': {
                          borderColor: '#6fba94'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6fba94'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Typography variant="body2" className="text-amber-800">
                  <strong>Google Account</strong> - Email and password cannot be modified. Avatar changes require contacting support.
                </Typography>
              </div>
            )}
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: '1px solid #e5e7eb',
            pt: 2,
            pb: 2,
            px: 2,
            gap: 1
          }}
        >
          <Button
            onClick={handleCancel}
            disabled={loading}
            sx={{
              color: '#6fba94',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            disabled={loading || profileData.provider === 'Google'}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: '#6fba94',
              color: 'white',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#5aa88f'
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af'
              }
            }}
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default Profile;