import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, School, MessageSquare, BarChart3, UserX, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPath = location.pathname;

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: School, label: 'Teachers', path: '/admin/teachers' },
    { icon: MessageSquare, label: 'Forum', path: '/admin/prompts' },
    { icon: BarChart3, label: 'Statistics', path: '/admin/statistics' },
    { icon: UserX, label: 'Inactive Users', path: '/admin/inactive' },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const isActive = (path) => currentPath === path;

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl transition-all duration-300 ease-in-out z-50 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className="border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #7BC5A5 0%, #69b895 100%)' }}>
        {/* Logo and Toggle */}
        <div className="h-16 flex items-center justify-between px-6">
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">MindfulMap</h1>
              <p className="text-white/80 text-xs font-medium">Admin Portal</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-white" />
            ) : (
              <X className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Admin Profile */}
        {!isCollapsed && (
          <div className="px-6 pb-6 pt-2">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <span className="text-white font-bold text-xl">👨‍💼</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">
                  Super Admin
                </p>
                <p className="text-xs text-white/80 truncate">System Administrator</p>
                <div className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/30">
                  🛡️ Full Access
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
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
            </a>
          );
        })}
      </nav>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="px-6 py-3 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Admin Panel v1.0.0</p>
        </div>
      )}

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl w-full transition-all duration-200 text-red-600 hover:bg-red-50 group"
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          {!isCollapsed && (
            <span className="font-medium text-sm">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;