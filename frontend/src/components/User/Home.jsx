import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef0ee]">
      <h1 className="text-5xl font-bold mb-6" style={{ color: '#3a3939' }}>Welcome to Mindful Map!</h1>
      <p className="text-lg mb-6" style={{ color: '#3a3939' }}>
        You have successfully logged in.
      </p>
      <button
        onClick={handleLogout}
        className="p-3 rounded-full bg-[#6fba94] text-white font-bold hover:bg-[#5aa88f]"
      >
        Logout
      </button>
    </div>
  );
};

export default Home;