import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Button, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardContent
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Navbar from './Navbar';

const StudentLogs = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [student, setStudent] = useState(null);
  const [moodLogs, setMoodLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    beforeValence: '',
    afterValence: '',
    startDate: null,
    endDate: null,
    searchTerm: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch student info and mood logs
      const [userResponse, logsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/user/${userId}/moodlogs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const studentData = userResponse.data.find(user => user.id === userId);
      setStudent(studentData);
      setMoodLogs(logsResponse.data);
      setFilteredLogs(logsResponse.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [filters, moodLogs]);

  const applyFilters = () => {
    let filtered = [...moodLogs];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    // Before valence filter
    if (filters.beforeValence) {
      filtered = filtered.filter(log => log.beforeValence === filters.beforeValence);
    }

    // After valence filter
    if (filters.afterValence) {
      filtered = filtered.filter(log => log.afterValence === filters.afterValence);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.date) >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.date) <= filters.endDate);
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.activity?.toLowerCase().includes(searchLower) ||
        log.beforeEmotion?.toLowerCase().includes(searchLower) ||
        log.afterEmotion?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      beforeValence: '',
      afterValence: '',
      startDate: null,
      endDate: null,
      searchTerm: ''
    });
  };



  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, ml: 'var(--sidebar-width)', display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>Loading student data...</Typography>
          </div>
        </Box>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
        <Navbar />

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: 4, ml: 'var(--sidebar-width)', transition: "all 0.3s ease", overflowX: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <button
                onClick={() => navigate('/admin/users')}
                className="mr-4 p-2.5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 text-gray-600 hover:text-green-600"
              >
                <ArrowBackIcon />
              </button>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f2937', trackingTight: true }}>
                Student Mood Logs
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#4b5563', fontWeight: 500, ml: 12 }}>
              Detailed activity and emotion logs for {student?.name || 'Student'}
            </Typography>
          </Box>

            {/* Student Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {student?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{student?.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Section</Typography>
                    <Typography variant="body1">{student?.section || 'Not Assigned'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={student?.status || 'Unknown'} 
                      color={student?.status === 'Active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

          {/* Controls */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ position: 'relative' }}
                >
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Chip
                      label={getActiveFiltersCount()}
                      size="small"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        minWidth: 20,
                        height: 20
                      }}
                    />
                  )}
                </Button>
                
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="text"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredLogs.length} of {moodLogs.length} logs
                </Typography>
              </Box>
            </Box>

            {/* Filters Panel */}
            {showFilters && (
              <Paper sx={{ p: 3, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Search"
                      placeholder="Search activities, emotions..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        label="Category"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        <MenuItem value="activity">Activity</MenuItem>
                        <MenuItem value="social">Social</MenuItem>
                        <MenuItem value="health">Health</MenuItem>
                        <MenuItem value="sleep">Sleep</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Before Valence</InputLabel>
                      <Select
                        value={filters.beforeValence}
                        onChange={(e) => handleFilterChange('beforeValence', e.target.value)}
                        label="Before Valence"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="positive">Positive</MenuItem>
                        <MenuItem value="negative">Negative</MenuItem>
                        <MenuItem value="can't remember">Can't Remember</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>After Valence</InputLabel>
                      <Select
                        value={filters.afterValence}
                        onChange={(e) => handleFilterChange('afterValence', e.target.value)}
                        label="After Valence"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="positive">Positive</MenuItem>
                        <MenuItem value="negative">Negative</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>

          {/* Logs Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Activity/Hours</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Before Valence</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Before Emotion</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>Before Intensity</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>After Valence</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>After Emotion</TableCell>
                  <TableCell sx={{ fontWeight: '800', color: '#10b981', fontSize: '1rem', py: 2.5 }}>After Intensity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ fontSize: '1rem', color: '#6b7280' }}>
                        {moodLogs.length === 0 ? 'No mood logs found for this student.' : 'No logs match the current filters.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, index) => {
                    const getCategoryColor = (category) => {
                      const colors = {
                        activity: '#3b82f6',  // Blue-500
                        social: '#8b5cf6',    // Violet-500
                        health: '#10b981',    // Emerald-500
                        sleep: '#f59e0b'      // Amber-500
                      };
                      return colors[category] || '#95A5A6';
                    };
                    
                    return (
                    <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell sx={{ fontSize: '1rem', fontWeight: 500, color: '#4b5563', whiteSpace: 'nowrap' }}>
                        <div>{new Date(log.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400 font-normal">{new Date(log.date).toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.category} 
                          size="small" 
                          sx={{
                            bgcolor: getCategoryColor(log.category) + '15',
                            color: getCategoryColor(log.category),
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            border: `1px solid ${getCategoryColor(log.category)}30`
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {log.category === 'sleep' ? `${log.hrs} hours` : log.activity}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.beforeValence} 
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            bgcolor: log.beforeValence === 'positive' ? '#DCFCE7' : log.beforeValence === 'negative' ? '#FEE2E2' : '#FEF3C7',
                            color: log.beforeValence === 'positive' ? '#166534' : log.beforeValence === 'negative' ? '#991B1B' : '#92400E',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#4b5563' }}>{log.beforeEmotion || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>{log.beforeIntensity || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.afterValence} 
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            bgcolor: log.afterValence === 'positive' ? '#DCFCE7' : '#FEE2E2',
                            color: log.afterValence === 'positive' ? '#166534' : '#991B1B',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem', color: '#4b5563' }}>{log.afterEmotion || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>{log.afterIntensity || '-'}</TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default StudentLogs;