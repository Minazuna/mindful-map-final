import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart3, Settings, LogOut, Menu, X, BookOpen, ChevronDown, Sparkles, Eye } from 'lucide-react';

const Sidebar = ({ teacher }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('teacherSidebarCollapsed') === 'true';
  });
  
  const [isStudentLogsExpanded, setIsStudentLogsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    localStorage.setItem('teacherSidebarCollapsed', isCollapsed);
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '5rem' : '18rem');
  }, [isCollapsed]);

  // All available sections
  const allSections = [
    'St. John Paul II (STEM 1)',
    'St. Paul VI (STEM 2)',
    'St. John XXIII (STEM 3)',
    'St. Pius X (HUMSS)',
    'St. Tarcisius (ABM)',
    'St. Jose Sanchez Del Rio (ICT)'
  ];

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: Settings, label: 'Edit Profile', path: '/teacher/edit-profile' },
    { icon: Sparkles, label: 'Recommendations', path: '/teacher/recommendations' },
    { icon: Eye, label: 'Monitor Students', path: '/teacher/monitor-students' }, // <-- Added MonitorStudents.jsx link
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => currentPath === path;

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl transition-all duration-300 ease-in-out z-50 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Profile Section */}
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
          <div className="flex flex-col items-center mt-4">
            <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden mb-3 shadow-lg bg-white/20 flex items-center justify-center">
              {teacher?.profilePicture ? (
                <img src={teacher.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{teacher?.firstName?.charAt(0)}</span>
              )}
            </div>
            <h3 className="text-white font-bold text-base px-4 text-center truncate w-full max-w-[240px]">
              {teacher?.firstName} {teacher?.lastName}
            </h3>
            <p className="text-white/80 text-[10px] px-4 text-center truncate w-full max-w-[240px]">
              {teacher?.email}
            </p>
            <p className="text-white/90 text-xs font-medium mt-1 px-4 text-center">
              {teacher?.subject || 'Teacher'}
            </p>
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

        {/* Student Logs with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={() => !isCollapsed && setIsStudentLogsExpanded(!isStudentLogsExpanded)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentPath.includes('/teacher/section/')
                ? 'text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={currentPath.includes('/teacher/section/') ? { backgroundColor: '#7BC5A5' } : {}}
            title={isCollapsed ? 'Student Logs' : ''}
          >
            <FileText 
              className={`w-5 h-5 transition-transform duration-200 ${
                currentPath.includes('/teacher/section/') ? 'text-white' : 'text-gray-500 group-hover:scale-110'
              }`}
              style={currentPath.includes('/teacher/section/') ? {} : { color: '#7BC5A5' }}
            />
            {!isCollapsed && (
              <>
                <span className={`font-medium text-sm ${currentPath.includes('/teacher/section/') ? 'text-white' : 'text-gray-700'}`}>
                  Student Logs
                </span>
                <ChevronDown 
                  className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                    isStudentLogsExpanded || currentPath.includes('/teacher/section/') ? 'rotate-180' : ''
                  } ${currentPath.includes('/teacher/section/') ? 'text-white' : 'text-gray-500'}`}
                />
              </>
            )}
          </button>

          {/* Dropdown Menu for Sections */}
          {(isStudentLogsExpanded || currentPath.includes('/teacher/section/')) && !isCollapsed && (
            <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
              {allSections.map((section, index) => {
                const isAssigned = teacher?.assignedSections?.includes(section);
                const sectionPath = `/teacher/section/${encodeURIComponent(section)}`;

                return isAssigned ? (
                  <button
                    key={index}
                    onClick={() => {
                      handleNavigation(sectionPath);
                      setIsStudentLogsExpanded(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                      currentPath === sectionPath
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7BC5A5' }}></div>
                    <span>{section}</span>
                  </button>
                ) : (
                  <div
                    key={index}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span>{section}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

export default Sidebar;