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
        <Box sx={{ width: 240, flexShrink: 0 }}>
          <Navbar />
        </Box>
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography>Loading student data...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
        {/* Sidebar */}
        <Box sx={{ width: 240, flexShrink: 0 }}>
          <Navbar />
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <button
                onClick={() => navigate('/admin/users')}
                className="mr-4 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "#333" }}>
                Student Mood Logs
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
          </Box>

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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Activity/Hours</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Before Valence</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Before Emotion</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Before Intensity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>After Valence</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>After Emotion</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>After Intensity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        {moodLogs.length === 0 ? 'No mood logs found for this student.' : 'No logs match the current filters.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, index) => {
                    const getCategoryColor = (category) => {
                      const colors = {
                        activity: '#2196F3',  // Blue
                        social: '#9C27B0',    // Violet
                        health: '#4CAF50',    // Green
                        sleep: '#FF9800'      // Orange
                      };
                      return colors[category] || '#95A5A6';
                    };
                    
                    return (
                    <TableRow key={index} hover>
                      <TableCell>
                        {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.category} 
                          size="small" 
                          variant="outlined"
                          sx={{
                            borderColor: getCategoryColor(log.category),
                            color: getCategoryColor(log.category),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {log.category === 'sleep' ? `${log.hrs} hours` : log.activity}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.beforeValence} 
                          size="small"
                          color={log.beforeValence === 'positive' ? 'success' : log.beforeValence === 'negative' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{log.beforeEmotion || 'N/A'}</TableCell>
                      <TableCell>{log.beforeIntensity || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.afterValence} 
                          size="small"
                          color={log.afterValence === 'positive' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{log.afterEmotion}</TableCell>
                      <TableCell>{log.afterIntensity}</TableCell>
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