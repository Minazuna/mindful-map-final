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
// Firebase imports
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    email: '',
    gender: '',
    section: '',
    password: '',
    avatar: null,
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Initialize Firebase
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      localStorage.setItem('token', response.data.token); // <-- Add this line
      setTimeout(() => {
        navigate('/choose-category');
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

  // Google sign-up handler
  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get user info from Google account
      const googleUserData = {
        email: user.email,
        firstName: user.displayName ? user.displayName.split(' ')[0] : '',
        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        avatar: user.photoURL || '',
        firebaseUid: user.uid,
      };
      
      // Call our backend to register/login the user
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
          // Check if the user has logged a mood for the day
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
              navigate('/log-mood');
            }
          } catch (error) {
            navigate('/log-mood');
          }
        }
      }
    } catch (error) {
      console.error("Google Sign-in Error:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  // Updated input styling
  const inputStyles = {
    base: "w-full p-3 rounded-xl border-2 border-[#6fba94] outline-none focus:border-[#6fba94] text-black bg-[#F1F8E8]",
  };

  return (
    <div className="min-h-screen flex bg-[#F1F8E8]">
      <ToastContainer />
      <style jsx>{`
        /* Fix for autofill visibility */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #F1F8E8 inset !important;
          -webkit-text-fill-color: #000000 !important;
          background-color: #F1F8E8 !important;
          color: #000000 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Ensure all input text is visible */
        input[type="text"],
        input[type="email"],
        input[type="password"] {
          color: #000000 !important;
          background-color: #F1F8E8 !important;
          font-size: 16px !important; /* Prevents zoom on iOS */
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        
        /* Placeholder styling */
        input::placeholder {
          color: #666666 !important;
          opacity: 1 !important;
        }
        
        /* Focus state improvements */
        input:focus {
          background-color: #F1F8E8 !important;
          color: #000000 !important;
          border-color: #6fba94 !important;
          box-shadow: 0 0 0 2px rgba(111, 186, 148, 0.2) !important;
        }
      `}</style>
      
      {/* Left Side - Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <form className="w-full max-w-md flex flex-col items-center" onSubmit={handleSubmit}>
          <h1 className="w-full text-center text-5xl font-bold mb-8" style={{ color: '#3a3939' }}>
            Create your account
          </h1>
          

          {/* First Name, Middle Initial, and Last Name */}
          <div className="w-full flex gap-3 mb-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className={inputStyles.base}
              style={{ 
                color: '#000000',
                backgroundColor: '#F1F8E8',
                fontSize: '16px',
                flex: '2'
              }}
              onChange={handleChange}
            />
            <input
              type="text"
              name="middleInitial"
              placeholder="M.I."
              className={inputStyles.base}
              maxLength="2"
              style={{ 
                color: '#000000',
                backgroundColor: '#F1F8E8',
                fontSize: '16px',
                width: '60px',
                flex: 'none'
              }}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className={inputStyles.base}
              style={{ 
                color: '#000000',
                backgroundColor: '#F1F8E8',
                fontSize: '16px',
                flex: '2'
              }}
              onChange={handleChange}
            />
          </div>
          
          {/* Gender and Section Dropdowns */}
          <div className="w-full flex gap-3 mb-4">
            <div className="w-1/2">
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#F1F8E8',
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                  '& fieldset': {
                    borderColor: '#6fba94',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6fba94',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6fba94',
                  },
                },
                '& .MuiSelect-select': {
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                  backgroundColor: '#F1F8E8',
                },
                '& .MuiMenuItem-root': {
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                }
              }}>
                <Select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#666666' }}>Gender</span>;
                    }
                    return selected;
                  }}
                  sx={{
                    color: '#000000',
                    backgroundColor: '#F1F8E8',
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        fontFamily: 'Nunito, sans-serif',
                        '& .MuiMenuItem-root': {
                          fontFamily: 'Nunito, sans-serif',
                          color: '#000000',
                        },
                        '& .MuiMenuItem-root:hover': {
                          backgroundColor: 'rgba(111, 186, 148, 0.1)',
                        },
                        '& .MuiMenuItem-root.Mui-selected': {
                          backgroundColor: 'rgba(111, 186, 148, 0.2)',
                          fontFamily: 'Nunito, sans-serif',
                          color: '#000000',
                        },
                        '& .MuiMenuItem-root.Mui-selected:hover': {
                          backgroundColor: 'rgba(111, 186, 148, 0.3)',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Rather not say">Rather not say</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="w-1/2">
              <FormControl fullWidth variant="outlined" sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#F1F8E8',
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                  '& fieldset': {
                    borderColor: '#6fba94',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6fba94',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6fba94',
                  },
                },
                '& .MuiSelect-select': {
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                  backgroundColor: '#F1F8E8',
                },
                '& .MuiMenuItem-root': {
                  fontFamily: 'Nunito, sans-serif',
                  color: '#000000',
                }
              }}>
                <Select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#666666' }}>Section</span>;
                    }
                    return selected;
                  }}
                  sx={{
                    color: '#000000',
                    backgroundColor: '#F1F8E8',
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        fontFamily: 'Nunito, sans-serif',
                        '& .MuiMenuItem-root': {
                          fontFamily: 'Nunito, sans-serif',
                          color: '#000000',
                        },
                        '& .MuiMenuItem-root:hover': {
                          backgroundColor: 'rgba(111, 186, 148, 0.1)',
                        },
                        '& .MuiMenuItem-root.Mui-selected': {
                          backgroundColor: 'rgba(111, 186, 148, 0.2)',
                          fontFamily: 'Nunito, sans-serif',
                          color: '#000000',
                        },
                        '& .MuiMenuItem-root.Mui-selected:hover': {
                          backgroundColor: 'rgba(111, 186, 148, 0.3)',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="Grade 11 - A">Grade 11 - A</MenuItem>
                  <MenuItem value="Grade 11 - B">Grade 11 - B</MenuItem>
                  <MenuItem value="Grade 11 - C">Grade 11 - C</MenuItem>
                  <MenuItem value="Grade 11 - D">Grade 11 - D</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            className={inputStyles.base + " mb-4"}
            onChange={handleChange}
            style={{ 
              color: '#000000',
              backgroundColor: '#F1F8E8',
              fontSize: '16px'
            }}
          />

          <div className="w-full relative mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className={inputStyles.base}
              onChange={handleChange}
              style={{ 
                color: '#000000',
                backgroundColor: '#F1F8E8',
                fontSize: '16px'
              }}
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <VisibilityOffIcon className="text-[#6fba94]"/> : <VisibilityIcon className="text-[#6fba94]"/>}
            </div>
          </div>

          <div className="w-full flex flex-col items-center mb-6">
            <label htmlFor="avatar" className="text-lg w-3/4 p-3 rounded-xl bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f] text-center cursor-pointer transition-colors">
              Upload Avatar
            </label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              className="hidden"
              onChange={handleChange}
            />
            {formData.avatar && (
              <p className="mt-2 text-sm text-gray-600">File selected: {formData.avatar.name}</p>
            )}
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            className="text-lg w-full p-3 rounded-xl bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f] mb-4 transition-colors"
          >
            Create Account
          </button>
          
          {/* Google Sign In Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="text-lg w-full p-3 rounded-xl bg-white border-2 border-[#6fba94] font-medium flex items-center justify-center gap-2 hover:bg-gray-50 mb-4 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M21.8 12.2c0-.7-.06-1.41-.17-2.08H12v3.93h5.5a4.7 4.7 0 01-2.04 3.09v2.57h3.3c1.94-1.78 3.04-4.4 3.04-7.5z"/>
              <path fill="#34A853" d="M12 22c2.75 0 5.07-.91 6.76-2.46l-3.3-2.57a6.45 6.45 0 01-3.46.96c-2.65 0-4.9-1.8-5.7-4.2H2.9v2.65A9.98 9.98 0 0012 22z"/>
              <path fill="#FBBC05" d="M6.3 13.73a6.1 6.1 0 01-.32-1.91c0-.66.12-1.3.32-1.91V7.27H2.9A9.96 9.96 0 002 12c0 1.61.39 3.14 1.07 4.49l3.23-2.76z"/>
              <path fill="#EA4335" d="M12 5.89c1.5 0 2.84.51 3.89 1.52l2.93-2.93C17.07 2.89 14.76 2 12 2a9.98 9.98 0 00-9.1 5.83l3.4 2.63c.8-2.4 3.06-4.2 5.7-4.2z"/>
            </svg>
            Sign up with Google
          </button>
          
          <p className="mt-2 text-base text-center">
            <span style={{ color: '#3a3939' }}>Already have an account? </span>
            <span
              style={{ color: '#6fba94', cursor: 'pointer' }}
              onClick={() => navigate('/signin')}
              className="hover:underline font-semibold"
            >
              Sign in.
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