import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, School, BarChart3, LogOut, Menu, X, TrendingUp } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPath = location.pathname;

  // Use ONLY these menu items
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: School, label: 'Teachers', path: '/admin/teachers' },
    { icon: BarChart3, label: 'Statistics', path: '/admin/statistics' },
    { icon: TrendingUp, label: 'Mood Predictions', path: '/admin/mood-predictions' },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const isActive = (path) => currentPath === path;

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl transition-all duration-300 ease-in-out z-50 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Header with Logo and Toggle */}
      <div className={`relative flex flex-col items-center justify-center border-b border-gray-100 transition-all duration-300 ${isCollapsed ? 'h-20' : 'py-8'}`} style={{ background: 'linear-gradient(135deg, #7BC5A5 0%, #69b895 100%)' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 left-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors z-10"
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-white" />
          ) : (
            <X className="w-5 h-5 text-white" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="flex flex-col items-center">
            <img
              src="/images/logo.png"
              alt="Mindful Map Logo"
              className="w-24 h-24 object-contain"
            />
            <h2 className="text-white font-bold text-lg mt-2 tracking-wide">
              Administrator
            </h2>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={active ? { backgroundColor: '#7BC5A5' } : {}}
              title={isCollapsed ? item.label : ''}
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'text-white' : 'text-gray-500 group-hover:scale-110'
                }`}
                style={active ? {} : { color: '#7BC5A5' }}
              />
              {!isCollapsed && (
                <span className={`font-medium text-sm ${active ? 'text-white' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              )}
              {active && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </button>
          );
        })}
      </nav>


      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl w-full transition-all duration-200 text-red-600 hover:bg-red-50 group"
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="font-medium text-sm">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;