import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from './Navbar';

const TeachersTable = () => {
  const [teachers, setTeachers] = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    assignedSections: [],
    subject: '',
    password: ''
  });
  const [emailError, setEmailError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const sections = ['St. John Paul II (STEM 1)', 'St. Paul VI (STEM 2)', 'St. John XXIII (STEM 3)', 'St. Pius X (HUMSS)', 'St. Tarcisius (ABM)', 'St. Jose Sanchez Del Rio (ICT)'];

  useEffect(() => {
    fetchTeachers();
    fetchTeacherStats();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/teacher-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeacherStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation functions
  const validateFirstName = (name) => {
    if (!name.trim()) return 'First name is required';
    if (name.length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    if (name.length > 50) {
      return 'Name cannot exceed 50 characters.';
    }
    if (!/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) {
      return 'Name can only contain letters, spaces, and hyphens.';
    }
    return '';
  };

  const validateLastName = (name) => {
    if (!name.trim()) return 'Last name is required';
    if (name.length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    if (name.length > 50) {
      return 'Name cannot exceed 50 characters.';
    }
    if (!/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) {
      return 'Name can only contain letters, spaces, and hyphens.';
    }
    return '';
  };

  const validateMiddleInitial = (mi) => {
    if (mi && !/^[A-Za-z.]{1,2}$/.test(mi)) {
      return 'Middle initial: letters only, max 2';
    }
    return '';
  };

  const validateEmailField = (email) => {
    if (!email.trim()) return 'Email is required';
    if (!validateEmail(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    return '';
  };

  const validateSubject = (subject) => {
    if (!subject.trim()) return 'Subject is required';
    if (subject.length < 2 || subject.length > 100) {
      return 'Subject must be between 2 and 100 characters';
    }
    return '';
  };

  const validateAssignedSections = (sections) => {
    if (!sections || sections.length === 0) {
      return 'At least one section must be assigned';
    }
    if (sections.length > 6) {
      return 'Cannot assign more than 6 sections';
    }
    return '';
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'firstName':
        error = validateFirstName(value);
        break;
      case 'lastName':
        error = validateLastName(value);
        break;
      case 'middleInitial':
        error = validateMiddleInitial(value);
        break;
      case 'email':
        error = validateEmailField(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'subject':
        error = validateSubject(value);
        break;
      case 'assignedSections':
        error = validateAssignedSections(value);
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Auto-uppercase middle initial
    if (name === 'middleInitial') {
      processedValue = value.toUpperCase();
    }
    
    // Trim leading spaces and capitalize first letter of each word for name fields
    if (name === 'firstName' || name === 'lastName') {
      processedValue = processedValue.replace(/^\s+/, ''); // Remove leading spaces
      if (processedValue.length > 0) {
        // Capitalize first letter of each word (separated by spaces or hyphens)
        processedValue = processedValue.replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }
    
    setFormData({ ...formData, [name]: processedValue });
    
    // Real-time validation
    const error = validateField(name, processedValue);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    // Clear email error when user starts typing
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = (e) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSectionChange = (section) => {
    const currentSections = formData.assignedSections;
    let newSections;
    
    if (currentSections.includes(section)) {
      newSections = currentSections.filter(s => s !== section);
    } else {
      newSections = [...currentSections, section];
    }
    
    setFormData({
      ...formData,
      assignedSections: newSections
    });

    // Validate sections
    const error = validateAssignedSections(newSections);
    setValidationErrors(prev => ({
      ...prev,
      assignedSections: error
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      assignedSections: [],
      subject: '',
      password: ''
    });
    setEmailError('');
    setValidationErrors({});
    setShowPassword(false);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors = {
      firstName: validateFirstName(formData.firstName),
      lastName: validateLastName(formData.lastName),
      middleInitial: validateMiddleInitial(formData.middleInitial),
      email: validateEmailField(formData.email),
      password: validatePassword(formData.password),
      subject: validateSubject(formData.subject),
      assignedSections: validateAssignedSections(formData.assignedSections)
    };

    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/admin/teachers`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Teacher created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { password, email, ...updateData } = formData; // Remove password and email from update
      
      const response = await axios.put(
        `${import.meta.env.VITE_NODE_API}/api/admin/teachers/${selectedTeacher._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Teacher updated successfully!');
        setShowEditModal(false);
        setSelectedTeacher(null);
        resetForm();
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to delete ${teacherName}'s account? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `${import.meta.env.VITE_NODE_API}/api/admin/teachers/${teacherId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success('Teacher deleted successfully!');
          fetchTeachers();
          fetchTeacherStats();
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        toast.error(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      middleInitial: teacher.middleInitial || '',
      email: teacher.email,
      assignedSections: teacher.assignedSections || [],
      subject: teacher.subject,
      password: '' // Don't populate password
    });
    setShowEditModal(true);
  };

  const getAllSections = () => {
    return sections; // All sections are available since teachers can have multiple sections
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-[280px] fixed h-full">
          <Navbar />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-[280px] flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-[280px] fixed h-full">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[280px]">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage teacher accounts and section assignments
          </p>
        </div>

        {/* Stats Cards */}
        {teacherStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{teacherStats.totalTeachers}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Teachers</dt>
                      <dd className="text-lg font-medium text-gray-900">{teacherStats.totalTeachers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {teacherStats.sectionStatus.filter(s => s.assigned).length}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assigned Sections</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teacherStats.sectionStatus.filter(s => s.assigned).length} / 6
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {teacherStats.sectionStatus.filter(s => !s.assigned).length}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Unassigned Sections</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teacherStats.sectionStatus.filter(s => !s.assigned).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Teachers ({teachers.length})</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium"
          >
            Add Teacher
          </button>
        </div>

        {/* Teachers Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {teachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first teacher account.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add First Teacher
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <li key={teacher._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={teacher.avatar || 'https://via.placeholder.com/48'}
                          alt={`${teacher.firstName} ${teacher.lastName}`}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-lg font-medium text-gray-900">
                            {teacher.firstName} {teacher.middleInitial && teacher.middleInitial + '. '}{teacher.lastName}
                          </p>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Teacher
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        <div className="mt-1 flex items-center space-x-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            📚 {teacher.subject}
                          </span>
                          {teacher.assignedSections && teacher.assignedSections.map((section, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              🏫 {section}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Created: {formatDate(teacher.createdAt)}
                      </span>
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                        className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section Status */}
        {teacherStats && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Section Assignment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teacherStats.sectionStatus.map((section) => (
                <div key={section.section} className={`p-4 rounded-lg border-2 ${
                  section.assigned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className="font-medium text-gray-900">{section.section}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.assigned ? (
                      <>
                        <span className="text-green-600">✓ Assigned to:</span><br />
                        {section.teacherNames.map((name, index) => (
                          <span key={index} className="font-medium block">{name}</span>
                        ))}
                      </>
                    ) : (
                      <span className="text-gray-500">⚪ Unassigned</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Teacher Account</h3>
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.firstName 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.lastName 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Middle Initial</label>
                    <input
                      type="text"
                      name="middleInitial"
                      value={formData.middleInitial}
                      onChange={handleInputChange}
                      maxLength="2"
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.middleInitial 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.middleInitial && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.middleInitial}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      required
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.email || emailError
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {(validationErrors.email || emailError) && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email || emailError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sections *</label>
                  <div className={`grid grid-cols-2 gap-2 p-3 border rounded-md ${
                    validationErrors.assignedSections 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}>
                    {getAllSections().map(section => (
                      <label key={section} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.assignedSections.includes(section)}
                          onChange={() => handleSectionChange(section)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{section}</span>
                      </label>
                    ))}
                  </div>
                  {validationErrors.assignedSections && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.assignedSections}</p>
                  )}
                </div>

                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics, English, Science"
                      className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.subject 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {validationErrors.subject && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      className={`mt-1 block w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                        validationErrors.password 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 104.243 4.243M14.121 14.121L15.536 15.536M14.121 14.121a3 3 0 01-4.243-4.243M14.121 14.121L9.878 9.878M14.121 14.121l1.415 1.415M8.464 8.464L6.05 6.05M8.464 8.464l1.414 1.414" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                  {formData.password && !validationErrors.password && (
                    <p className="mt-1 text-sm text-green-600">✓ Password set</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      Object.values(validationErrors).some(error => error !== '') ||
                      emailError || 
                      !formData.email || 
                      !formData.firstName || 
                      !formData.lastName || 
                      !formData.password || 
                      !formData.subject ||
                      formData.assignedSections.length === 0
                    }
                    className={`px-4 py-2 rounded-md ${
                      Object.values(validationErrors).some(error => error !== '') ||
                      emailError || 
                      !formData.email || 
                      !formData.firstName || 
                      !formData.lastName || 
                      !formData.password || 
                      !formData.subject ||
                      formData.assignedSections.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Create Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Teacher Account</h3>
              <form onSubmit={handleEditTeacher} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Middle Initial</label>
                    <input
                      type="text"
                      name="middleInitial"
                      value={formData.middleInitial}
                      onChange={handleInputChange}
                      maxLength="2"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sections *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getAllSections().map(section => (
                      <label key={section} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.assignedSections.includes(section)}
                          onChange={() => handleSectionChange(section)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{section}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics, English, Science"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTeacher(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersTable;