import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      email: formData.email,
      password: formData.password,
    };
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/auth/login`, data);
  
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success("Login successful!");
  
        // Fetch user role
        const userResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${response.data.token}`,
          },
        });
  
        if (userResponse.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (userResponse.data.role === 'user') {
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
            if (error.response && error.response.data.message === 'No mood logs found') {
              navigate('/log-mood');
            } else {
              toast.error('Error fetching mood logs.');
            }
          }
        } else {
          toast.error("Unknown user role.");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message;
  
        if (error.response.status === 403) {
          if (errorMessage === "Your account is deactivated.") {
            toast.error("Your account has been deactivated. Please contact support.");
          } else if (errorMessage === "Please verify your email to log in.") {
            toast.error("Please verify your email before logging in.");
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(errorMessage || "An error occurred during login.");
        }
      } else {
        toast.error("Server is unreachable. Please try again later.");
      }
    }
  };  

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-3/5 bg-cover bg-center" style={{ backgroundImage: "url('/images/trynow.png')" }}>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h1 className="text-5xl font-bold text-white">Welcome Back!</h1>
          <p className="text-lg text-white mt-4">
            We are excited to continue your <br />
            mental wellness journey.
          </p>
        </div>
      </div>
      <div className="w-2/5 flex items-center justify-center bg-[#eef0ee]">
        <form className="w-3/5 flex flex-col items-center" onSubmit={handleSubmit}>
          <h2 className="w-full text-left text-5xl font-bold mb-6" style={{ color: '#3a3939' }}>Sign In</h2>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-3 mb-4 rounded-full bg-[#eef0ee] border-2 border-[#6fba94] outline-none focus:border-[#6fba94]"
            onChange={handleChange}
          />
          <div className="relative w-full mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="w-full p-3 rounded-full bg-[#eef0ee] border-2 border-[#6fba94] outline-none focus:border-[#6fba94]"
              onChange={handleChange}
            />
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <VisibilityOffIcon className="text-[#6fba94]" /> : <VisibilityIcon className="text-[#6fba94]" />}
            </div>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="text-lg w-full p-3 rounded-full bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f]"
          >
            Sign In
          </button>
          <p className="mt-4 text-mg">
            <span style={{ color: '#3a3939' }}>Don't have an account? </span>
            <span
              style={{ color: '#6fba94', cursor: 'pointer' }}
              onClick={() => navigate('/signup')}
            >
              Sign up.
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signin;