import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    email: '',
    gender: 'Rather not say',
    section: '',
    password: '',
    avatar: null,
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    initializeApp(firebaseConfig);
  }, []);

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateFirstName = (name) => {
    if (name && name.length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    if (name && name.length > 50) {
      return 'Name cannot exceed 50 characters.';
    }
    if (name && !/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) {
      return 'Name can only contain letters, spaces, and dashes.';
    }
    return '';
  };

  const validateLastName = (name) => {
    if (name && name.length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    if (name && name.length > 50) {
      return 'Name cannot exceed 50 characters.';
    }
    if (name && !/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) {
      return 'Name can only contain letters, spaces, and dashes.';
    }
    return '';
  };

  const validateMiddleInitial = (mi) => {
    if (mi && !/^[A-Za-z.]{1,2}$/.test(mi)) {
      return 'Middle initial must contain only letters and periods';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    return '';
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'firstName':
        error = validateFirstName(value);
        break;
      case 'lastName':
        error = validateLastName(value);
        break;
      case 'middleInitial':
        error = validateMiddleInitial(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = files ? files[0] : value;
    
    if (name === 'middleInitial') {
      newValue = newValue.toUpperCase();
    }
    
    if (name === 'firstName' || name === 'lastName') {
      newValue = newValue.replace(/^\s+/, '');
      if (newValue.length > 0) {
        newValue = newValue.replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }
    
    setFormData({
      ...formData,
      [name]: newValue,
    });

    if (!files) {
      const error = validateField(name, newValue);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {
      email: validateEmail(formData.email),
      firstName: validateFirstName(formData.firstName),
      lastName: validateLastName(formData.lastName),
      middleInitial: validateMiddleInitial(formData.middleInitial),
      password: validatePassword(formData.password),
    };

    const hasErrors = Object.values(errors).some(error => error !== '');
    
    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('middleInitial', formData.middleInitial);
    data.append('lastName', formData.lastName);
    data.append('email', formData.email);
    data.append('gender', formData.gender || 'Rather not say');
    data.append('section', formData.section);
    data.append('password', formData.password);
    if (formData.avatar) {
      data.append('avatar', formData.avatar);
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/auth/signup`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('Registration successful!');
        setError('');
        setValidationErrors({});
        localStorage.setItem('token', response.data.token);
        setTimeout(() => {
          navigate('/daily-quote');
        }, 3000);
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (error) {
      setError('An error occurred during registration. Please try again.');
      toast.error('An error occurred during registration. Please try again.');
      console.error('Error during registration:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const googleUserData = {
        email: user.email,
        firstName: user.displayName ? user.displayName.split(' ')[0] : '',
        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        avatar: user.photoURL || '',
        firebaseUid: user.uid,
      };
      
      const response = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/auth/google-auth`,
        googleUserData
      );
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success("Google sign-in successful!");
        
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          try {
            const moodLogResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
              headers: {
                Authorization: `Bearer ${response.data.token}`,
              },
            });
  
            const today = new Date().toISOString().split('T')[0];
            const loggedToday = moodLogResponse.data.some(log => log.date.split('T')[0] === today);
  
            if (loggedToday) {
              navigate('/mood-entries');
            } else {
              navigate('/daily-quote');
            }
          } catch (error) {
            navigate('/daily-quote');
          }
        }
      }
    } catch (error) {
      console.error("Google Sign-in Error:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Left Side - Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <form className="w-full max-w-lg flex flex-col" onSubmit={handleSubmit}>
          <h1 className="text-5xl font-bold mb-2 text-[#3a3939] text-center">
            Create your account
          </h1>

          {/* Name Fields */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                className={`w-full px-4 py-4 text-xl rounded-xl border-2 transition-all duration-200
                  ${validationErrors.firstName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-[#D8EFD3] focus:border-[#55AD9B] focus:ring-2 focus:ring-[#55AD9B]/20'
                  }
                  bg-white text-gray-900 placeholder:text-gray-400 outline-none`}
                value={formData.firstName}
                onChange={handleChange}
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-sm mt-1.5 ml-1">{validationErrors.firstName}</p>
              )}
            </div>
            <div className="w-20">
              <input
                type="text"
                name="middleInitial"
                placeholder="M.I."
                maxLength="2"
                className={`w-full px-3 py-4 text-xl text-center rounded-xl border-2 transition-all duration-200
                  ${validationErrors.middleInitial 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-[#D8EFD3] focus:border-[#55AD9B] focus:ring-2 focus:ring-[#55AD9B]/20'
                  }
                  bg-white text-gray-900 placeholder:text-gray-400 outline-none`}
                value={formData.middleInitial}
                onChange={handleChange}
              />
              {validationErrors.middleInitial && (
                <p className="text-red-500 text-xs mt-1.5">{validationErrors.middleInitial}</p>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                className={`w-full px-4 py-4 text-xl rounded-xl border-2 transition-all duration-200
                  ${validationErrors.lastName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-[#D8EFD3] focus:border-[#55AD9B] focus:ring-2 focus:ring-[#55AD9B]/20'
                  }
                  bg-white text-gray-900 placeholder:text-gray-400 outline-none`}
                value={formData.lastName}
                onChange={handleChange}
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-sm mt-1.5 ml-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Gender and Section */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <FormControl fullWidth>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  displayEmpty
                  className="rounded-xl"
                  sx={{
                    height: '60px',
                    fontSize: '1.25rem',
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D8EFD3',
                      borderWidth: '2px',
                      borderRadius: '12px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#55AD9B',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#55AD9B',
                      borderWidth: '2px',
                    },
                    '& .MuiSelect-select': {
                      fontSize: '1.25rem',
                      color: '#111827',
                    },
                  }}
                >
                  <MenuItem value="Male" sx={{ fontSize: '1.25rem' }}>Male</MenuItem>
                  <MenuItem value="Female" sx={{ fontSize: '1.25rem' }}>Female</MenuItem>
                  <MenuItem value="Rather not say" sx={{ fontSize: '1.25rem' }}>Rather not say</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="flex-1">
              <FormControl fullWidth>
                <Select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  displayEmpty
                  className="rounded-xl"
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span className="text-gray-400">Section</span>;
                    }
                    return selected;
                  }}
                  sx={{
                    height: '60px',
                    fontSize: '1.25rem',
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D8EFD3',
                      borderWidth: '2px',
                      borderRadius: '12px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#55AD9B',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#55AD9B',
                      borderWidth: '2px',
                    },
                    '& .MuiSelect-select': {
                      fontSize: '1.25rem',
                      color: '#111827',
                    },
                  }}
                >
                  <MenuItem value="St. John Paul II (STEM 1)" sx={{ fontSize: '1.125rem' }}>St. John Paul II (STEM 1)</MenuItem>
                  <MenuItem value="St. Paul VI (STEM 2)" sx={{ fontSize: '1.125rem' }}>St. Paul VI (STEM 2)</MenuItem>
                  <MenuItem value="St. John XXIII (STEM 3)" sx={{ fontSize: '1.125rem' }}>St. John XXIII (STEM 3)</MenuItem>
                  <MenuItem value="St. Pius X (HUMSS)" sx={{ fontSize: '1.125rem' }}>St. Pius X (HUMSS)</MenuItem>
                  <MenuItem value="St. Tarcisius (ABM)" sx={{ fontSize: '1.125rem' }}>St. Tarcisius (ABM)</MenuItem>
                  <MenuItem value="St. Jose Sanchez Del Rio (ICT)" sx={{ fontSize: '1.125rem' }}>St. Jose Sanchez Del Rio (ICT)</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className={`w-full px-4 py-4 text-xl rounded-xl border-2 transition-all duration-200
                ${validationErrors.email 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                  : 'border-[#D8EFD3] focus:border-[#55AD9B] focus:ring-2 focus:ring-[#55AD9B]/20'
                }
                bg-white text-gray-900 placeholder:text-gray-400 outline-none`}
              value={formData.email}
              onChange={handleChange}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className={`w-full px-4 py-4 text-xl rounded-xl border-2 transition-all duration-200 pr-12
                  ${validationErrors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-[#D8EFD3] focus:border-[#55AD9B] focus:ring-2 focus:ring-[#55AD9B]/20'
                  }
                  bg-white text-gray-900 placeholder:text-gray-400 outline-none`}
                value={formData.password}
                onChange={handleChange}
              />
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#55AD9B] hover:text-[#3e8e7e] transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </div>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">{validationErrors.password}</p>
            )}
            {formData.password && !validationErrors.password && (
              <p className="text-green-600 text-sm mt-1.5 ml-1">✓ Password meets requirements</p>
            )}
          </div>

          {/* Avatar Upload */}
          <div className="mb-6">
            <label 
              htmlFor="avatar" 
              className="flex items-center justify-center px-6 py-4 text-lg rounded-xl border-2 border-dashed border-[#55AD9B] 
                bg-[#55AD9B]/5 text-[#55AD9B] font-semibold hover:bg-[#55AD9B]/10 cursor-pointer transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formData.avatar ? formData.avatar.name : 'Upload Avatar (Optional)'}
            </label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              className="hidden"
              onChange={handleChange}
              accept="image/*"
            />
          </div>

          {/* Data Privacy Notice (Philippines) */}
          <div className="mb-6 rounded-xl border-2 border-[#D8EFD3] bg-[#F7FBF9] p-4">
            <h3 className="text-[#1b5f52] text-lg font-bold mb-2">
              Data Privacy Notice (Philippines)
            </h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              <span className="font-semibold text-[#0f766e]">
                Your personal data is protected under the Data Privacy Act of 2012 (Republic Act No. 10173).
              </span>{' '}
              Mindful Map processes your information lawfully, fairly, and securely in accordance with applicable Philippine data privacy regulations.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>We collect only data necessary to provide account and app features.</li>
              <li>Your data is not sold and is not shared with unauthorized third parties.</li>
              <li>Access to personal data is limited to authorized personnel/systems only.</li>
              <li>Reasonable technical, organizational, and physical safeguards are applied to protect your data.</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] 
              text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-200 mb-4"
          >
            Create Account
          </button>
          
          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-4 text-lg font-semibold rounded-xl border-2 border-[#D8EFD3] 
              bg-white text-gray-700 flex items-center justify-center gap-3 
              hover:bg-gray-50 hover:border-[#55AD9B] hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200 mb-6 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.8 12.2c0-.7-.06-1.41-.17-2.08H12v3.93h5.5a4.7 4.7 0 01-2.04 3.09v2.57h3.3c1.94-1.78 3.04-4.4 3.04-7.5z"/>
              <path fill="#34A853" d="M12 22c2.75 0 5.07-.91 6.76-2.46l-3.3-2.57a6.45 6.45 0 01-3.46.96c-2.65 0-4.9-1.8-5.7-4.2H2.9v2.65A9.98 9.98 0 0012 22z"/>
              <path fill="#FBBC05" d="M6.3 13.73a6.1 6.1 0 01-.32-1.91c0-.66.12-1.3.32-1.91V7.27H2.9A9.96 9.96 0 002 12c0 1.61.39 3.14 1.07 4.49l3.23-2.76z"/>
              <path fill="#EA4335" d="M12 5.89c1.5 0 2.84.51 3.89 1.52l2.93-2.93C17.07 2.89 14.76 2 12 2a9.98 9.98 0 00-9.1 5.83l3.4 2.63c.8-2.4 3.06-4.2 5.7-4.2z"/>
            </svg>
            Sign up with Google
          </button>
          
          {/* Sign In Link */}
          <p className="text-center text-base text-gray-600">
            Already have an account?{' '}
            <span
              onClick={() => navigate('/signin')}
              className="text-[#55AD9B] font-semibold hover:text-[#3e8e7e] hover:underline transition-colors cursor-pointer"
            >
              Sign in
            </span>
          </p>
        </form>
      </div>
    {/* Right Side - Logo Container */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="bg-[#95D2B3] rounded-3xl shadow-lg p-24 flex items-center justify-center w-200 h-200">
          <img
            src="/images/logo.png"
            alt="Mindful Map Logo"
            className="max-w-86 max-h-96 object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/')}
          />
        </div>
      </div>
    </div>
  );
};
export default Signup;