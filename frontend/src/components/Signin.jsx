import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Modal for Terms and Conditions
function TermsModal({ open, onClose }) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!open) setAgreed(false);
  }, [open]);

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
          <div className="text-2xl font-bold mb-4 text-[#1b5f52] text-center">Terms &amp; Conditions</div>
          <div className="text-gray-700 text-base mb-6 max-h-72 overflow-y-auto">
            <h3 className="text-[#1b5f52] text-lg font-bold mb-2">
              Data Privacy Notice (Philippines)
            </h3>
            <p className="mb-3 leading-relaxed">
              <span className="font-semibold text-[#0f766e]">
                Your personal data is protected under the Data Privacy Act of 2012 (Republic Act No. 10173).
              </span>{' '}
              Mindful Map processes your information lawfully, fairly, and securely in accordance with applicable Philippine data privacy regulations.
            </p>
            <ul className="list-disc pl-6 my-3 space-y-1">
              <li>We collect only data necessary to provide account and app features.</li>
              <li>Your data is not sold and is not shared with unauthorized third parties.</li>
              <li>Access to personal data is limited to authorized personnel/systems only.</li>
              <li>Reasonable technical, organizational, and physical safeguards are applied to protect your data.</li>
            </ul>
          </div>
          <div className="flex items-center mb-6">
            <input
              id="agree"
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="w-5 h-5 accent-[#55AD9B] mr-2"
            />
            <label htmlFor="agree" className="text-[#1b5f52] font-medium cursor-pointer">
              I have read and agree to the Terms &amp; Conditions and Data Privacy Notice (RA 10173)
            </label>
          </div>
          <button
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
              agreed
                ? 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] hover:from-[#3e8e7e] hover:to-[#55AD9B]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!agreed}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    )
  );
}

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    let error = '';
    if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    const hasErrors = Object.values(errors).some(error => error !== '');

    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

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
        } else if (userResponse.data.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else if (userResponse.data.role === 'user') {
          navigate('/daily-quote');
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
          if (errorMessage === "Please verify your email to log in.") {
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
        } else if (response.data.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/daily-quote');
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

      {/* Terms Modal */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />

      {/* Left Side - Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <form className="w-full max-w-lg flex flex-col" onSubmit={handleSubmit}>
          <h1 className="text-5xl font-bold mb-2 text-[#3a3939] text-center">
            Welcome back!
          </h1>

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
            Sign In
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
            Sign in with Google
          </button>

          {/* Terms and Conditions */}
          <div className="mb-4 text-center">
            <span
              className="text-md text-[#55AD9B] underline cursor-pointer hover:text-[#3e8e7e] transition-colors"
              onClick={() => setShowTerms(true)}
            >
              Terms &amp; Conditions
            </span>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-base text-gray-600">
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/signup')}
              className="text-[#55AD9B] font-semibold hover:text-[#3e8e7e] hover:underline transition-colors cursor-pointer"
            >
              Sign up
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

export default Signin;