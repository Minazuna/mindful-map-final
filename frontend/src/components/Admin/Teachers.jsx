import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from './Navbar';

const Teachers = () => {
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
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const sections = [
    'St. John Paul II (STEM 1)',
    'St. Paul VI (STEM 2)',
    'St. John XXIII (STEM 3)',
    'St. Pius X (HUMSS)',
    'St. Tarcisius (ABM)',
    'St. Jose Sanchez Del Rio (ICT)',
  ];

  useEffect(() => {
    fetchTeachers();
    fetchTeacherStats();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTeacherStats(response.data.data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
    if (name.length < 2) return 'Name must be at least 2 characters long.';
    if (name.length > 50) return 'Name cannot exceed 50 characters.';
    if (!/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) return 'Name can only contain letters, spaces, and hyphens.';
    return '';
  };

  const validateLastName = (name) => {
    if (!name.trim()) return 'Last name is required';
    if (name.length < 2) return 'Name must be at least 2 characters long.';
    if (name.length > 50) return 'Name cannot exceed 50 characters.';
    if (!/^[a-zA-Z]+([a-zA-Z\s-]*[a-zA-Z])*$/.test(name)) return 'Name can only contain letters, spaces, and hyphens.';
    return '';
  };

  const validateMiddleInitial = (mi) => {
    if (mi && !/^[A-Za-z.]{1,2}$/.test(mi)) return 'Middle initial: letters only, max 2';
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
    if (subject.length < 2 || subject.length > 100) return 'Subject must be between 2 and 100 characters';
    return '';
  };

  const validateAssignedSections = (sectionsValue) => {
    if (!sectionsValue || sectionsValue.length === 0) return 'At least one section must be assigned';
    if (sectionsValue.length > 6) return 'Cannot assign more than 6 sections';
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
      processedValue = processedValue.replace(/^\s+/, '');
      if (processedValue.length > 0) {
        processedValue = processedValue.replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }

    setFormData({ ...formData, [name]: processedValue });

    // Real-time validation
    const error = validateField(name, processedValue);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Clear email error when user starts typing
    if (name === 'email' && emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = (e) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) setEmailError('Please enter a valid email address');
    else setEmailError('');
  };

  const handleSectionChange = (section) => {
    const currentSections = formData.assignedSections;
    let newSections;

    if (currentSections.includes(section)) newSections = currentSections.filter((s) => s !== section);
    else newSections = [...currentSections, section];

    setFormData({
      ...formData,
      assignedSections: newSections,
    });

    const error = validateAssignedSections(newSections);
    setValidationErrors((prev) => ({
      ...prev,
      assignedSections: error,
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
      password: '',
    });
    setEmailError('');
    setValidationErrors({});
    setShowPassword(false);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    const errors = {
      firstName: validateFirstName(formData.firstName),
      lastName: validateLastName(formData.lastName),
      middleInitial: validateMiddleInitial(formData.middleInitial),
      email: validateEmailField(formData.email),
      password: validatePassword(formData.password),
      subject: validateSubject(formData.subject),
      assignedSections: validateAssignedSections(formData.assignedSections),
    };

    const hasErrors = Object.values(errors).some((error) => error !== '');
    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/admin/teachers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Teacher created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTeachers();
        fetchTeacherStats();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();

    const errors = {
      firstName: validateFirstName(formData.firstName),
      lastName: validateLastName(formData.lastName),
      middleInitial: validateMiddleInitial(formData.middleInitial),
      email: validateEmailField(formData.email),
      subject: validateSubject(formData.subject),
      assignedSections: validateAssignedSections(formData.assignedSections),
    };

    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;
    }

    const hasErrors = Object.values(errors).some((error) => error !== '' && error !== undefined);
    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const response = await axios.put(`${import.meta.env.VITE_NODE_API}/api/admin/teachers/${selectedTeacher._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Teacher updated successfully!');
        setShowEditModal(false);
        setSelectedTeacher(null);
        resetForm();
        fetchTeachers();
        fetchTeacherStats();
      } else {
        toast.error(response.data.message || 'Failed to update teacher');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to delete ${teacherName}'s account? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${import.meta.env.VITE_NODE_API}/api/admin/teachers/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          toast.success('Teacher deleted successfully!');
          fetchTeachers();
          fetchTeacherStats();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting teacher:', error);
        toast.error(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    const validSections = (teacher.assignedSections || []).filter((s) => sections.includes(s));

    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      middleInitial: teacher.middleInitial || '',
      email: teacher.email,
      assignedSections: validSections,
      subject: teacher.subject,
      password: '',
    });
    setShowEditModal(true);
  };

  const getAllSections = () => sections;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (teacher) => {
    const first = (teacher?.firstName || '').trim();
    const last = (teacher?.lastName || '').trim();
    const a = first ? first[0].toUpperCase() : '';
    const b = last ? last[0].toUpperCase() : '';
    return (a + b) || 'T';
  };

  const PrimaryButton = ({ children, ...props }) => (
    <button
      {...props}
      className={[
        'px-4 py-2 rounded-lg text-sm font-semibold',
        'bg-blue-600 text-white hover:bg-blue-700',
        'shadow-sm hover:shadow transition',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        props.disabled ? 'opacity-60 cursor-not-allowed hover:bg-blue-600 hover:shadow-sm' : '',
        props.className || '',
      ].join(' ')}
    >
      {children}
    </button>
  );

  const SecondaryButton = ({ tone = 'neutral', children, ...props }) => {
    const tones = {
      neutral: 'border-gray-200 text-gray-700 hover:bg-gray-50',
      warning: 'border-yellow-200 text-yellow-800 hover:bg-yellow-50',
      danger: 'border-red-200 text-red-700 hover:bg-red-50',
    };
    return (
      <button
        {...props}
        className={[
          'px-4 py-2 rounded-lg text-sm font-semibold border bg-white',
          'shadow-sm hover:shadow transition',
          'focus:outline-none focus:ring-2 focus:ring-gray-500/20',
          tones[tone] || tones.neutral,
          props.disabled ? 'opacity-60 cursor-not-allowed hover:shadow-sm' : '',
          props.className || '',
        ].join(' ')}
      >
        {children}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 ml-[var(--sidebar-width)] flex justify-center items-center transition-all duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const assignedCount = teacherStats?.sectionStatus?.filter((s) => s.assigned).length ?? 0;
  const unassignedCount = teacherStats?.sectionStatus?.filter((s) => !s.assigned).length ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 ml-[var(--sidebar-width)] transition-all duration-300 p-10 overflow-x-auto">
        {/* Header */}
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teacher Management</h1>
          <p className="mt-2 text-base text-gray-600 font-medium">Manage teacher accounts and section assignments</p>
        </div>

        {/* Stats Cards */}
        {teacherStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{teacherStats.totalTeachers}</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-500 truncate">Total Teachers</dt>
                      <dd className="text-2xl font-bold text-gray-900">{teacherStats.totalTeachers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{assignedCount}</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-500 truncate">Assigned Sections</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {assignedCount} <span className="text-sm font-semibold text-gray-500">/ 6</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{unassignedCount}</span>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-500 truncate">Unassigned Sections</dt>
                      <dd className="text-2xl font-bold text-gray-900">{unassignedCount}</dd>
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
            <h2 className="text-xl font-bold text-gray-900">
              Teachers <span className="text-gray-500 font-semibold">({teachers.length})</span>
            </h2>
          </div>
          <PrimaryButton onClick={() => setShowCreateModal(true)}>Add Teacher</PrimaryButton>
        </div>

        {/* Teachers List */}
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl border border-gray-100">
          {teachers.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="#2563EB"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 20a8 8 0 0 0-16 0"
                    stroke="#2563EB"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No teachers yet</h3>
              <p className="text-gray-600 mb-5">Create your first teacher account to begin assigning sections.</p>
              <PrimaryButton onClick={() => setShowCreateModal(true)}>Add First Teacher</PrimaryButton>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {teachers.map((teacher) => (
                <li key={teacher._id} className="px-6 py-5 hover:bg-gray-50/60 transition">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex-shrink-0">
                        {teacher.avatar ? (
                          <img
                            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-gray-200"
                            src={teacher.avatar}
                            alt={`${teacher.firstName} ${teacher.lastName}`}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center font-bold ring-1 ring-blue-200">
                            {getInitials(teacher)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                            {teacher.firstName} {teacher.middleInitial && `${teacher.middleInitial}. `}{teacher.lastName}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                            Teacher
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 font-medium mt-1 truncate">{teacher.email}</p>

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Subject: {teacher.subject}
                          </span>

                          {teacher.assignedSections &&
                            teacher.assignedSections.map((section, index) => (
                              <span
                                key={`${teacher._id}-${index}`}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold bg-purple-50 text-purple-800 border border-purple-100"
                              >
                                <span className="w-2 h-2 rounded-full bg-purple-600" />
                                {section}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-semibold">
                        Created <span className="font-medium">{formatDate(teacher.createdAt)}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <SecondaryButton tone="warning" onClick={() => openEditModal(teacher)}>
                          Edit
                        </SecondaryButton>
                        <SecondaryButton
                          tone="danger"
                          onClick={() => handleDeleteTeacher(teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                        >
                          Delete
                        </SecondaryButton>
                      </div>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Section Assignment Status</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teacherStats.sectionStatus.map((section) => {
                const isAssigned = section.assigned;
                return (
                  <div
                    key={section.section}
                    className={[
                      'p-4 rounded-xl border shadow-sm',
                      isAssigned ? 'border-green-100 bg-green-50/60' : 'border-gray-200 bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-gray-900 leading-snug">{section.section}</h4>
                      <span
                        className={[
                          'inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold border',
                          isAssigned ? 'bg-green-50 text-green-700 border-green-100' : 'bg-white text-gray-600 border-gray-200',
                        ].join(' ')}
                      >
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      {isAssigned ? (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-green-700">Assigned to</div>
                          <div className="space-y-1">
                            {section.teacherNames.map((name, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                <span className="font-semibold text-gray-900">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="font-medium">No teacher assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-5 w-full max-w-2xl">
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Create Teacher</h3>
                <p className="text-sm text-gray-600 mt-1">Add a teacher account and assign sections.</p>
              </div>

              <div className="px-6 py-5">
                <form onSubmit={handleCreateTeacher} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.firstName ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.firstName && <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.lastName ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.lastName && <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Middle Initial</label>
                      <input
                        type="text"
                        name="middleInitial"
                        value={formData.middleInitial}
                        onChange={handleInputChange}
                        maxLength="2"
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.middleInitial
                            ? 'border-red-300 focus:ring-red-500/30'
                            : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.middleInitial && <p className="mt-1 text-sm text-red-600">{validationErrors.middleInitial}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.email || emailError ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {(validationErrors.email || emailError) && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.email || emailError}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Sections *</label>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-xl ${
                        validationErrors.assignedSections ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50/40'
                      }`}
                    >
                      {getAllSections().map((section) => (
                        <label key={section} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/60 transition">
                          <input
                            type="checkbox"
                            checked={formData.assignedSections.includes(section)}
                            onChange={() => handleSectionChange(section)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 font-medium">{section}</span>
                        </label>
                      ))}
                    </div>
                    {validationErrors.assignedSections && <p className="mt-1 text-sm text-red-600">{validationErrors.assignedSections}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics, English, Science"
                      className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                        validationErrors.subject ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                      }`}
                    />
                    {validationErrors.subject && <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength="6"
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 ${
                          validationErrors.password ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M6.05 6.05l12.02 12.02"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="submit"
                      disabled={
                        Object.values(validationErrors).some((error) => error !== '') ||
                        emailError ||
                        !formData.email ||
                        !formData.firstName ||
                        !formData.lastName ||
                        !formData.password ||
                        !formData.subject ||
                        formData.assignedSections.length === 0
                      }
                    >
                      Create Teacher
                    </PrimaryButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-5 w-full max-w-2xl">
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Edit Teacher</h3>
                <p className="text-sm text-gray-600 mt-1">Update teacher details and section assignments.</p>
              </div>

              <div className="px-6 py-5">
                <form onSubmit={handleEditTeacher} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.firstName ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.firstName && <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.lastName ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.lastName && <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Middle Initial</label>
                      <input
                        type="text"
                        name="middleInitial"
                        value={formData.middleInitial}
                        onChange={handleInputChange}
                        maxLength="2"
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.middleInitial
                            ? 'border-red-300 focus:ring-red-500/30'
                            : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.middleInitial && <p className="mt-1 text-sm text-red-600">{validationErrors.middleInitial}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          validationErrors.email ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Sections *</label>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-xl ${
                        validationErrors.assignedSections ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50/40'
                      }`}
                    >
                      {getAllSections().map((section) => (
                        <label key={section} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/60 transition">
                          <input
                            type="checkbox"
                            checked={formData.assignedSections.includes(section)}
                            onChange={() => handleSectionChange(section)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 font-medium">{section}</span>
                        </label>
                      ))}
                    </div>
                    {validationErrors.assignedSections && <p className="mt-1 text-sm text-red-600">{validationErrors.assignedSections}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics, English, Science"
                      className={`mt-1 block w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 ${
                        validationErrors.subject ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                      }`}
                    />
                    {validationErrors.subject && <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">New Password (leave blank to keep current)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength="6"
                        className={`mt-1 block w-full border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 ${
                          validationErrors.password ? 'border-red-300 focus:ring-red-500/30' : 'border-gray-200 focus:ring-blue-500/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M6.05 6.05l12.02 12.02"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedTeacher(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="submit"
                      disabled={
                        Object.values(validationErrors).some((error) => error !== '' && error !== undefined) ||
                        !formData.email ||
                        !formData.firstName ||
                        !formData.lastName ||
                        !formData.subject ||
                        formData.assignedSections.length === 0
                      }
                    >
                      Update Teacher
                    </PrimaryButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;