import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'Rather not say',
    password: '',
    avatar: null,
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('gender', formData.gender);
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
        toast.success('Registration successful! Please check your email to verify your account.');
        setError('');
        setTimeout(() => {
          navigate('/signin');
        }, 3000); // Redirect after 3 seconds
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

  return (
    <div className="min-h-screen flex">
      <ToastContainer />
      <div className="w-3/5 bg-cover bg-center" style={{ backgroundImage: "url('/images/trynow.png')" }}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h1 className="text-5xl font-bold text-white">Welcome to Mindful Map!</h1>
          <p className="text-lg text-white mt-4">
            We are excited to guide you through your <br />
            mental wellness journey.
          </p>
        </div>
      </div>
      <div className="w-2/5 flex items-center justify-center bg-[#eef0ee]">
        <form className="w-3/5 flex flex-col items-center" onSubmit={handleSubmit}>
          <h2 className="w-full text-left text-5xl font-bold mb-6" style={{ color: '#3a3939' }}>Sign Up</h2>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full p-3 mb-4 rounded-full bg-[#eef0ee] border-2 border-[#6fba94] outline-none focus:border-[#6fba94]"
            onChange={handleChange}
          />
          
                {/* Gender Selection Dropdown */}
        <div className="w-full mb-4">
          <FormControl fullWidth variant="outlined" sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '9999px',
              backgroundColor: '#eef0ee',
              fontFamily: 'Nunito, sans-serif',
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
            },
            '& .MuiMenuItem-root': {
              fontFamily: 'Nunito, sans-serif',
            }
          }}>
            <Select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              displayEmpty
              renderValue={(selected) => selected}
              MenuProps={{
                PaperProps: {
                  sx: {
                    fontFamily: 'Nunito, sans-serif',
                    '& .MuiMenuItem-root': {
                      fontFamily: 'Nunito, sans-serif',
                    },
                    '& .MuiMenuItem-root:hover': {
                      backgroundColor: 'rgba(111, 186, 148, 0.1)',
                    },
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: 'rgba(111, 186, 148, 0.2)',
                      fontFamily: 'Nunito, sans-serif',
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
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-3 mb-4 rounded-full bg-[#eef0ee] border-2 border-[#6fba94] outline-none focus:border-[#6fba94]"
            onChange={handleChange}
          />
          <div className="w-full relative mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="w-full p-3 rounded-full bg-[#eef0ee] border-2 border-[#6fba94] outline-none focus:border-[#6fba94]"
              onChange={handleChange}
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <VisibilityOffIcon className="text-[#6fba94]"/> : <VisibilityIcon className="text-[#6fba94]"/>}
            </div>
          </div>
          <div className="w-full flex flex-col items-center mb-6">
            <label htmlFor="avatar" className="text-lg w-1/2 p-3 rounded-full bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f] text-center cursor-pointer">
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
            className="text-lg w-full p-3 rounded-full bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f]"
          >
            Sign Up
          </button>
          <p className="mt-4 text-mg">
            <span style={{ color: '#3a3939' }}>Already have an account? </span>
            <span
              style={{ color: '#6fba94', cursor: 'pointer' }}
              onClick={() => navigate('/signin')}
            >
              Sign in.
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;